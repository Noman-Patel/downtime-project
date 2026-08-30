package com.example.downtime.Service;

import com.example.downtime.DTO.DashboardSummaryDTO;
import com.example.downtime.DTO.DowntimeByMachineDTO;
import com.example.downtime.DTO.DowntimeByReasonDTO;
import com.example.downtime.Entities.DowntimeEvent;
import com.example.downtime.Entities.DowntimeStatus;
import com.example.downtime.Repository.DowntimeEventRepository;
import com.example.downtime.Repository.MachineRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final DowntimeEventRepository downtimeEventRepository;
    private final MachineRepository machineRepository;

    public DashboardService(
            DowntimeEventRepository downtimeEventRepository,
            MachineRepository machineRepository) {

        this.downtimeEventRepository = downtimeEventRepository;
        this.machineRepository = machineRepository;
    }

    public DashboardSummaryDTO getSummary() {

        long totalDowntimeEvents = downtimeEventRepository.count();

        long openDowntimeEvents =
                downtimeEventRepository.countByStatus(DowntimeStatus.OPEN);

        long resolvedDowntimeEvents =
                downtimeEventRepository.countByStatus(DowntimeStatus.RESOLVED);

        long totalMachines = machineRepository.count();

        List<DowntimeEvent> downtimeEvents = downtimeEventRepository.findAll();

        long totalDowntimeMinutes = downtimeEvents.stream()
                .filter(event -> event.getResolvedAt() != null)
                .mapToLong(event ->
                        Duration.between(
                                event.getOccurredAt(),
                                event.getResolvedAt()
                        ).toMinutes()
                )
                .sum();

        return new DashboardSummaryDTO(
                totalDowntimeEvents,
                openDowntimeEvents,
                resolvedDowntimeEvents,
                totalMachines,
                totalDowntimeMinutes
        );
    }


    public List<DowntimeByReasonDTO> getDowntimeByReason() {

        return downtimeEventRepository.findAll()
                .stream()
                .filter(event -> event.getDowntimeReason() != null)
                .collect(Collectors.groupingBy(
                        event -> event.getDowntimeReason().getName(),
                        Collectors.counting()
                ))
                .entrySet()
                .stream()
                .map(entry ->
                        new DowntimeByReasonDTO(
                                entry.getKey(),
                                entry.getValue()
                        )
                )
                .toList();
    }


    public List<DowntimeByMachineDTO> getDowntimeByMachine() {

        return downtimeEventRepository.findAll()
                .stream()
                .collect(Collectors.groupingBy(
                        DowntimeEvent::getMachine,
                        Collectors.counting()
                ))
                .entrySet()
                .stream()
                .map(entry ->
                        new DowntimeByMachineDTO(
                                entry.getKey().getId(),
                                entry.getKey().getName(),
                                entry.getValue()
                        )
                )
                .toList();
    }
}