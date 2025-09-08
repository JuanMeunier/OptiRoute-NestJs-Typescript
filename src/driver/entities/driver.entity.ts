import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Vehicle } from 'src/vehicles/entities/vehicle.entity';

@Entity('drivers')
export class Driver {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    licenseNumber: string;

    @ManyToOne(() => Vehicle, (vehicle) => vehicle.drivers)
    vehicle: Vehicle | null;
}
