import {
  prop,
  getModelForClass,
  modelOptions,
  Severity,
} from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

@modelOptions({
  schemaOptions: {
    collection: "tbl_pins",
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class Pin extends CommonTypegooseEntity {
  @prop({ type: String, required: true })
  title!: string;

  @prop({ type: String, required: false, default: "" })
  description?: string;

  @prop({ type: Number, required: true })
  lat!: number;

  @prop({ type: Number, required: true })
  lng!: number;

  @prop({ type: String, required: true, unique: true })
  shareId!: string;
}

export const PinModel = getModelForClass(Pin);
