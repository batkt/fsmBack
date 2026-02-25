import mongoose, { Schema } from "mongoose";

mongoose.pluralize(null);

const baraaSchema = new Schema(
  {
    ner: { type: String, required: true }, 
    turul: {
      type: String,
      enum: ["tseverlegch", "ugaalgiin", "ariutgagch", "bagaj", "busad"],
      default: "tseverlegch"
    },
    tailbar: { type: String }, 
    negj: {
      type: String,
      enum: ["shirheg", "litr", "kg", "haire", "bogts", "dana"],
      default: "shirheg"
    },
    une: { type: Number, default: 0 },
    uldegdel: { type: Number, default: 0 }, 
    doodUldegdel: { type: Number, default: 0 },
    barcode: { type: String }, 
    zurgiinId: { type: String },
    brand: { type: String }, 
    niiluulegch: { type: String },
    idevhtei: { type: Boolean, default: true },
    baiguullagiinId: { type: String, required: true },
    barilgiinId: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

baraaSchema.index({ baiguullagiinId: 1, barilgiinId: 1 });
baraaSchema.index({ baiguullagiinId: 1, turul: 1 });
baraaSchema.index({ ner: "text" });
baraaSchema.index({ barcode: 1 });

export default function getBaraaModel(conn: any) {
  if (!conn || !conn.kholbolt) {
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  }
  return conn.kholbolt.model("baraa", baraaSchema);
}
