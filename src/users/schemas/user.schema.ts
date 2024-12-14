import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema()
export class User {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  email: string;


  @Prop({ required: true , default: 'user'})
  role: string;

  @Prop({ Type: [Types.ObjectId], ref: 'Catalog' })
  catalogIds: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);