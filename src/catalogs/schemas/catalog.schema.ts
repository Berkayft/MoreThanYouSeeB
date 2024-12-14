import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";



@Schema()
export class Catalog {

    @Prop({ required: true  , unique: true})
    name: string;

    @Prop({ type: [Types.ObjectId], ref: 'Content' })
    contents: Types.ObjectId[];
    
    @Prop({ type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

}


export const CatalogSchema = SchemaFactory.createForClass(Catalog);