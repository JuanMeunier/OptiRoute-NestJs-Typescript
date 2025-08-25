import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
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

    // Coordenadas de origen
    @Column('decimal', { precision: 10, scale: 6, nullable: true })
    originLat: number;

    @Column('decimal', { precision: 10, scale: 6, nullable: true })
    originLng: number;

    // Coordenadas de destino
    @Column('decimal', { precision: 10, scale: 6, nullable: true })
    destinationLat: number;

    @Column('decimal', { precision: 10, scale: 6, nullable: true })
    destinationLng: number;

    // Distancia y tiempo estimados (calculados con Google Maps)
    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    estimatedDistance: number;

    @Column('int', { nullable: true })
    estimatedTime: number; // en minutos

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({
        type: 'enum',
        enum: RequestStatus,
        default: RequestStatus.PENDING,
    })
    status: RequestStatus;

    // Relaciones
    @ManyToOne(() => User, (user) => user.requests)
    user: User;

    @ManyToOne(() => Vehicle, (vehicle) => vehicle.requests)
    vehicle: Vehicle;
}
