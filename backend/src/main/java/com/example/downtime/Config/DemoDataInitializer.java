package com.example.downtime.Config;

import com.example.downtime.Entities.Department;
import com.example.downtime.Entities.DowntimeEvent;
import com.example.downtime.Entities.DowntimeStatus;
import com.example.downtime.Entities.Machine;
import com.example.downtime.Entities.ProductionLine;
import com.example.downtime.Repository.DepartmentRepository;
import com.example.downtime.Repository.DowntimeEventRepository;
import com.example.downtime.Repository.MachineRepository;
import com.example.downtime.Repository.ProductionLineRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Adds a realistic, searchable dataset when the application starts with the
 * {@code demo} profile and the active application tables are empty.
 */
@Component
@Profile("demo")
public class DemoDataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    private final DepartmentRepository departmentRepository;
    private final ProductionLineRepository productionLineRepository;
    private final MachineRepository machineRepository;
    private final DowntimeEventRepository downtimeEventRepository;

    public DemoDataInitializer(
            DepartmentRepository departmentRepository,
            ProductionLineRepository productionLineRepository,
            MachineRepository machineRepository,
            DowntimeEventRepository downtimeEventRepository
    ) {
        this.departmentRepository = departmentRepository;
        this.productionLineRepository = productionLineRepository;
        this.machineRepository = machineRepository;
        this.downtimeEventRepository = downtimeEventRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        long departmentCount = departmentRepository.count();
        long productionLineCount = productionLineRepository.count();
        long machineCount = machineRepository.count();
        long downtimeEventCount = downtimeEventRepository.count();

        if (departmentCount > 0
                || productionLineCount > 0
                || machineCount > 0
                || downtimeEventCount > 0) {
            log.info("Demo data was not added because application data already exists");
            return;
        }

        LocalDateTime now = LocalDateTime.now().withSecond(0).withNano(0);

        Department assembly = departmentRepository.save(department(
                "Assembly Operations",
                "Final assembly, joining, and end-of-line verification",
                "Building A"
        ));
        Department fabrication = departmentRepository.save(department(
                "Fabrication",
                "Machining, forming, and component preparation",
                "Building B"
        ));
        Department packaging = departmentRepository.save(department(
                "Packaging & Logistics",
                "Finished-product packing, labeling, and material flow",
                "Building C"
        ));

        ProductionLine assemblyLineA = productionLineRepository.save(productionLine(
                assembly,
                "Assembly Line A",
                "Building A - North Bay"
        ));
        ProductionLine assemblyLineB = productionLineRepository.save(productionLine(
                assembly,
                "Assembly Line B",
                "Building A - South Bay"
        ));
        ProductionLine machiningCell = productionLineRepository.save(productionLine(
                fabrication,
                "Machining Cell 1",
                "Building B - East Bay"
        ));
        ProductionLine packagingLine = productionLineRepository.save(productionLine(
                packaging,
                "Packaging Line 1",
                "Building C - Main Floor"
        ));

        Machine cncMill = machineRepository.save(machine(
                machiningCell,
                "CNC Mill M-01",
                "CNC machining center",
                "Cell 1 - Station 1"
        ));
        Machine hydraulicPress = machineRepository.save(machine(
                machiningCell,
                "Hydraulic Press HP-01",
                "Hydraulic forming press",
                "Cell 1 - Station 2"
        ));
        Machine roboticWelder = machineRepository.save(machine(
                assemblyLineA,
                "Robotic Welder RW-01",
                "Six-axis welding cell",
                "Line A - Station 3"
        ));
        Machine conveyor = machineRepository.save(machine(
                assemblyLineA,
                "Transfer Conveyor CV-01",
                "Powered roller conveyor",
                "Line A - Stations 4-7"
        ));
        Machine servoPress = machineRepository.save(machine(
                assemblyLineB,
                "Servo Press SP-02",
                "Electric servo press",
                "Line B - Station 2"
        ));
        Machine torqueStation = machineRepository.save(machine(
                assemblyLineB,
                "Torque Station TS-02",
                "Automated fastening station",
                "Line B - Station 6"
        ));
        Machine casePacker = machineRepository.save(machine(
                packagingLine,
                "Case Packer CP-01",
                "Automatic case packer",
                "Packaging - Station 2"
        ));
        Machine labeler = machineRepository.save(machine(
                packagingLine,
                "Labeler LB-01",
                "Print-and-apply labeler",
                "Packaging - Station 4"
        ));

        List<DowntimeEvent> events = List.of(
                resolvedEvent(
                        cncMill,
                        "Spindle motor overload",
                        "A motor overload stopped the spindle during a heavy cut. Maintenance cleaned the cooling intake, checked current draw, and reset the overload relay.",
                        now.minusDays(24).minusHours(3),
                        Duration.ofMinutes(48)
                ),
                resolvedEvent(
                        cncMill,
                        "Spindle bearing vibration",
                        "Rising vibration indicated wear in the upper spindle bearing. The bearing cartridge was replaced and alignment was verified.",
                        now.minusDays(15).minusHours(2),
                        Duration.ofHours(2).plusMinutes(18)
                ),
                openEvent(
                        cncMill,
                        "Coolant level sensor intermittent",
                        "The coolant sensor is intermittently reporting an empty tank even after cleaning the float and connector. Electrical inspection is in progress.",
                        now.minusHours(7)
                ),
                resolvedEvent(
                        hydraulicPress,
                        "Hydraulic pump motor overload",
                        "High return-line pressure caused a motor overload. The clogged filter was replaced and operating pressure returned to specification.",
                        now.minusDays(19).minusHours(1),
                        Duration.ofHours(1).plusMinutes(32)
                ),
                openEvent(
                        hydraulicPress,
                        "Main ram seal leak",
                        "Oil was found around the main ram seal. The press is isolated while the replacement seal kit is prepared.",
                        now.minusHours(4)
                ),
                resolvedEvent(
                        roboticWelder,
                        "Fixture proximity sensor misalignment",
                        "A shifted proximity sensor prevented the weld cycle from starting. The bracket was realigned and the fixture was cycle-tested.",
                        now.minusDays(12).minusHours(4),
                        Duration.ofMinutes(36)
                ),
                resolvedEvent(
                        roboticWelder,
                        "Axis four servo motor overload",
                        "Cable drag increased axis resistance and triggered a motor overload. The cable carrier was repositioned and the axis was recalibrated.",
                        now.minusDays(5).minusHours(3),
                        Duration.ofMinutes(54)
                ),
                resolvedEvent(
                        conveyor,
                        "Drive-end bearing temperature high",
                        "The drive-end bearing temperature exceeded its limit. Maintenance replaced the dry bearing and confirmed normal temperature under load.",
                        now.minusDays(10).minusHours(2),
                        Duration.ofHours(1).plusMinutes(14)
                ),
                openEvent(
                        conveyor,
                        "Photoeye sensor blocked",
                        "The product-detection sensor remains blocked after lens cleaning. Wiring and mounting are being inspected before restart.",
                        now.minusHours(2)
                ),
                resolvedEvent(
                        servoPress,
                        "Feeder motor overload",
                        "A jammed guide rail overloaded the feeder motor. The obstruction was removed, the guides were adjusted, and the feeder was tested.",
                        now.minusDays(8).minusHours(5),
                        Duration.ofMinutes(43)
                ),
                resolvedEvent(
                        servoPress,
                        "Feeder bearing noise",
                        "Inspection confirmed excessive play in the feeder bearing. The bearing was replaced and lubrication intervals were reviewed.",
                        now.minusDays(3).minusHours(2),
                        Duration.ofMinutes(57)
                ),
                resolvedEvent(
                        torqueStation,
                        "Torque sensor calibration drift",
                        "The torque sensor failed the daily verification check. Controls recalibrated the transducer and validated ten sample cycles.",
                        now.minusDays(13).minusHours(1),
                        Duration.ofMinutes(41)
                ),
                openEvent(
                        casePacker,
                        "Infeed motor overload",
                        "Cases are binding at the infeed transition and repeatedly causing a motor overload. Guide-rail inspection is underway.",
                        now.minusHours(5)
                ),
                resolvedEvent(
                        labeler,
                        "Product sensor signal loss",
                        "An intermittent product sensor connection skipped label triggers. The damaged connector was replaced and label placement was verified.",
                        now.minusDays(1).minusHours(3),
                        Duration.ofMinutes(29)
                )
        );

        downtimeEventRepository.saveAll(events);
        log.info(
                "Added demo data: {} departments, {} production lines, {} machines, and {} downtime events",
                3,
                4,
                8,
                events.size()
        );
    }

    private static Department department(String name, String description, String location) {
        Department department = new Department();
        department.setName(name);
        department.setDescription(description);
        department.setLocation(location);
        return department;
    }

    private static ProductionLine productionLine(
            Department department,
            String name,
            String location
    ) {
        ProductionLine productionLine = new ProductionLine();
        productionLine.setDepartment(department);
        productionLine.setName(name);
        productionLine.setLocation(location);
        return productionLine;
    }

    private static Machine machine(
            ProductionLine productionLine,
            String name,
            String type,
            String location
    ) {
        Machine machine = new Machine();
        machine.setProductionLine(productionLine);
        machine.setName(name);
        machine.setType(type);
        machine.setLocation(location);
        return machine;
    }

    private static DowntimeEvent openEvent(
            Machine machine,
            String faultReason,
            String description,
            LocalDateTime occurredAt
    ) {
        return downtimeEvent(
                machine,
                faultReason,
                description,
                DowntimeStatus.OPEN,
                occurredAt,
                null
        );
    }

    private static DowntimeEvent resolvedEvent(
            Machine machine,
            String faultReason,
            String description,
            LocalDateTime occurredAt,
            Duration duration
    ) {
        return downtimeEvent(
                machine,
                faultReason,
                description,
                DowntimeStatus.RESOLVED,
                occurredAt,
                occurredAt.plus(duration)
        );
    }

    private static DowntimeEvent downtimeEvent(
            Machine machine,
            String faultReason,
            String description,
            DowntimeStatus status,
            LocalDateTime occurredAt,
            LocalDateTime resolvedAt
    ) {
        DowntimeEvent event = new DowntimeEvent();
        event.setMachine(machine);
        event.setFaultReason(faultReason);
        event.setDescription(description);
        event.setStatus(status);
        event.setOccurredAt(occurredAt);
        event.setResolvedAt(resolvedAt);
        return event;
    }
}
