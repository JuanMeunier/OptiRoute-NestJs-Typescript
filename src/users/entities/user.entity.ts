import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Request } from 'src/request/entities/request.entity';

export enum UserRole {
    ADMIN = 'admin',
    CLIENT = 'client',
    STAFF = 'staff',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.CLIENT,
    })
    role: UserRole;

    @OneToMany(() => Request, (request) => request.user)
    requests: Request[];
}
