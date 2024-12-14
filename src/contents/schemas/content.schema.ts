import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema()
export class Content {

    @Prop()
    imagePath: string;

    @Prop()
    callBackUrl: string;

    @Prop({type: Types.ObjectId, ref: 'Catalog'})
    catalogId: Types.ObjectId;

}

export const ContentSchema = SchemaFactory.createForClass(Content);