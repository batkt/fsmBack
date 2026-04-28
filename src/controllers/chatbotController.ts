import { Response } from "express";
import { getFsmConnFromReq } from "../utils/fsmConn";

export const getDefaultQuestions = async (req: any, res: Response) => {
  try {
    const conn = getFsmConnFromReq(req);
    const BotKnowledge = require("../models/botKnowledge")(conn);
    
    const questions = await BotKnowledge.find({ isDefault: true }).limit(5);
    
    if (questions.length === 0) {
      return res.status(200).json([
        { question: "Өнөөдөр хэдэн даалгавартай вэ?", answer: "Таны өнөөдрийн даалгавруудыг шалгаж байна..." },
        { question: "Даалгаврыг хэрхэн эхлүүлэх вэ?", answer: "Даалгаврын дэлгэрэнгүй цонхноос 'Эхлэх' товчийг дарна уу." },
        { question: "Зураг хэрхэн нэмэх вэ?", answer: "Даалгавар дотор 'Зураг' хэсгийн 'Нэмэх' товчийг ашиглана уу." },
        { question: "Чат хэрхэн ашиглах вэ?", answer: "Даалгаврын карт дээрх чат дүрс дээр дарж нэвтэрнэ үү." }
      ]);
    }

    res.status(200).json(questions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const askBot = async (req: any, res: Response) => {
  try {
    const { question } = req.body;
    const userId = req.ajiltan?.id || "anonymous";
    const bid = req.ajiltan?.baiguullagiinId;
    const conn = getFsmConnFromReq(req);
    
    const BotKnowledge = require("../models/botKnowledge")(conn);
    const BotInteraction = require("../models/botInteraction")(conn);

    const lowerQ = question.toLowerCase();

    // --- APP DATA LOGIC ---
    
    // 1. Task counting (Today)
    if ((lowerQ.includes("даалгавар") || lowerQ.includes("ажил")) && 
        (lowerQ.includes("хэд") || lowerQ.includes("өнөөдөр"))) {
      
      const TaskModel = require("../models/task")(conn, true);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      
      const count = await TaskModel.countDocuments({
        $or: [{ hariutsagchId: userId }, { ajiltnuud: userId }],
        ekhlekhOgnoo: { $lte: todayEnd },
        duusakhOgnoo: { $gte: todayStart }
      });

      const answer = count > 0 
        ? `Танд өнөөдөр ${count} даалгавар хуваарилагдсан байна.` 
        : "Танд өнөөдөр хуваарилагдсан даалгавар байхгүй байна.";
      
      await BotInteraction.create({ userId, userQuestion: question, botAnswer: answer, isAnswered: true, baiguullagiinId: bid });
      return res.status(200).json({ answer });
    }

    // 2. Completed Tasks
    if (lowerQ.includes("дууссан") && lowerQ.includes("даалгавар")) {
      const TaskModel = require("../models/task")(conn, true);
      const count = await TaskModel.countDocuments({
        $or: [{ hariutsagchId: userId }, { ajiltnuud: userId }],
        tuluv: "duussan"
      });
      const answer = `Та нийт ${count} даалгавар амжилттай дуусгасан байна. Сайн ажиллаж байна!`;
      await BotInteraction.create({ userId, userQuestion: question, botAnswer: answer, isAnswered: true, baiguullagiinId: bid });
      return res.status(200).json({ answer });
    }

    // 3. Project listing
    if (lowerQ.includes("төсөл") && (lowerQ.includes("миний") || lowerQ.includes("ямар"))) {
      const ProjectModel = require("../models/project")(conn, true);
      const projects = await ProjectModel.find({
        baiguullagiinId: bid
      }).limit(5);

      if (projects.length > 0) {
        const names = projects.map((p: any) => p.ner).join(", ");
        const answer = `Таны оролцож буй төслүүд: ${names}.`;
        await BotInteraction.create({ userId, userQuestion: question, botAnswer: answer, isAnswered: true, baiguullagiinId: bid });
        return res.status(200).json({ answer });
      }
    }

    // 4. Organization/Profile Info
    if (lowerQ.includes("байгууллага") || lowerQ.includes("би хэн") || lowerQ.includes("миний нэр")) {
      const userName = req.ajiltan?.ner || "ажилтан";
      const answer = `Таны нэр: ${userName}. Та ${bid ? "бүртгэлтэй байгууллагадаа" : "манай системд"} ажиллаж байна.`;
      await BotInteraction.create({ userId, userQuestion: question, botAnswer: answer, isAnswered: true, baiguullagiinId: bid });
      return res.status(200).json({ answer });
    }

    // --- KNOWLEDGE BASE LOGIC ---

    const match = await BotKnowledge.findOne({
      $or: [
        { question: new RegExp(question, "i") },
        { keywords: { $in: [new RegExp(question, "i")] } }
      ]
    });

    if (match) {
      await BotInteraction.create({ userId, userQuestion: question, botAnswer: match.answer, isAnswered: true, baiguullagiinId: bid });
      await BotKnowledge.updateOne({ _id: match._id }, { $inc: { usageCount: 1 } });
      return res.status(200).json({ answer: match.answer });
    }

    // --- FALLBACK & LEARNING ---
    await BotInteraction.create({
      userId,
      userQuestion: question,
      isAnswered: false,
      baiguullagiinId: bid
    });

    res.status(200).json({ 
      answer: "Уучлаарай, би энэ асуултанд хариулж мэдэхгүй байна. Би таны асуултыг бүртгэж авлаа, удахгүй хариулттай болох болно.",
      unrecognized: true 
    });

  } catch (error: any) {
    console.error("Chatbot Error:", error);
    res.status(500).json({ message: "Уучлаарай, алдаа гарлаа." });
  }
};
