import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne } from 'typeorm';
import { Driver } from 'src/driver/entities/driver.entity';
import { GPS } from 'src/gps/entities/gps.entity';
import { Request } from 'src/request/entities/request.entity';

@Entity('vehicles')
export class Vehicle {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    licensePlate: string;

    @Column()
    brand: string;

    @Column()
    model: string;

    @Column()
    capacity: number;

    @OneToOne(() => GPS, (gps) => gps.vehicle)
    gps: GPS | null;

    @OneToMany(() => Driver, (driver) => driver.vehicle)
    drivers: Driver[];

    @OneToMany(() => Request, (request) => request.vehicle)
    requests: Request[];
}
