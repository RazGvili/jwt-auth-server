import { Field, Int, ObjectType } from 'type-graphql';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

// Create graphql type with ObjectType and Field
@ObjectType()
@Entity('users')
export class User extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;

    // Enter Postgre types inside parenthesis
    // typeorm can infer
    @Field()
    @Column('text')
    email: string;

    // Not using @Field here to not expose password
    @Column('text')
    password: string;

    @Column('int', { default: 0 })
    tokenVersion: number;
}
