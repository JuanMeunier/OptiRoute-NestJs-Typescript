import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Vehicle } from 'src/vehicles/entities/vehicle.entity';

@Entity('gps')
export class GPS {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('decimal', { precision: 10, scale: 6 })
    latitude: number;

    @Column('decimal', { precision: 10, scale: 6 })
    longitude: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    lastUpdate: Date;

    @OneToOne(() => Vehicle, (vehicle) => vehicle.gps, { onDelete: 'CASCADE' })
    @JoinColumn()
    vehicle: Vehicle;
}
