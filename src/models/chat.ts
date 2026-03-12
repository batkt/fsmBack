const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const chatSchema = new Schema(
  {
    projectId: { type: String, required: true },
    taskId: { type: String },
    ajiltniiId: { type: String, required: true },
    ajiltniiNer: { type: String },
    medeelel: { type: String },
    turul: {
      type: String,
      enum: ["text", "zurag", "file"],
      default: "text"
    },
    fileZam: { type: String },
    fileNer: { type: String },
    khemjee: { type: Number },
    fType: { type: String }, 
    unshsan: [{ type: String }],
    baiguullagiinId: { type: String, required: true },
    barilgiinId: { type: String, required: true },
    
    replyTo: {
      chatId:     { type: String },          
      medeelel:   { type: String },          
      ajiltniiNer: { type: String },         
      turul:      { type: String }           
    },
    
    isEdited:  { type: Boolean, default: false },
    editedAt:  { type: Date },
    
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

chatSchema.index({ projectId: 1, taskId: 1, createdAt: -1 });
chatSchema.index({ baiguullagiinId: 1, barilgiinId: 1 });
chatSchema.index({ ajiltniiId: 1 });

module.exports = function a(conn: any, connectFSM = true, modelName = "chat") {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  
  const fsmConn = connectFSM && conn.kholboltFSM ? conn.kholboltFSM : conn.kholbolt;

  return fsmConn.model(modelName, chatSchema);
};
