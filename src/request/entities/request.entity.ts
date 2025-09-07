import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Vehicle } from 'src/vehicles/entities/vehicle.entity';

export enum RequestStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

@Entity('requests')
export class Request {
    @PrimaryGeneratedColumn()
    id: number;

    // Direcciones del pedido
    @Column()
    originAddress: string;

    @Column()
    destinationAddress: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({
        type: 'enum',
        enum: RequestStatus,
        default: RequestStatus.PENDING,
    })
    status: RequestStatus;

    // ID del driver que tomó la request (null al inicio)
    @Column({ nullable: true })
    driverId: number | null;

    @Column({ nullable: true })
    userId: number;

    // Relaciones
    @ManyToOne(() => User, (user) => user.requests)
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Vehicle, (vehicle) => vehicle.requests)
    vehicle: Vehicle | null;
}
