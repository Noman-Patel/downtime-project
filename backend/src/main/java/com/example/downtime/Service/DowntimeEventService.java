package com.example.downtime.Service;

import com.example.downtime.Entities.DowntimeEvent;
import com.example.downtime.Entities.DowntimeReason;
import com.example.downtime.Entities.DowntimeStatus;
import com.example.downtime.Entities.Machine;
import com.example.downtime.Exception.DowntimeEventNotFoundException;
import com.example.downtime.Exception.DowntimeReasonNotFoundException;
import com.example.downtime.Exception.MachineNotFoundException;
import com.example.downtime.Repository.DowntimeEventRepository;
import com.example.downtime.Repository.DowntimeReasonRepository;
import com.example.downtime.Repository.MachineRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DowntimeEventService {

    private final DowntimeEventRepository downtimeEventRepository;
    private final MachineRepository machineRepository;
    private final DowntimeReasonRepository downtimeReasonRepository;

    public DowntimeEventService(
            DowntimeEventRepository downtimeEventRepository,
            MachineRepository machineRepository,
            DowntimeReasonRepository downtimeReasonRepository
    ) {
        this.downtimeEventRepository = downtimeEventRepository;
        this.machineRepository = machineRepository;
        this.downtimeReasonRepository = downtimeReasonRepository;
    }

    public List<DowntimeEvent> getAllDowntimeEvents() {
        return downtimeEventRepository.findAll();
    }

    public DowntimeEvent getDowntimeEventById(Long id) {
        return downtimeEventRepository.findById(id)
                .orElseThrow(() -> new DowntimeEventNotFoundException(id));
    }

    public List<DowntimeEvent> getDowntimeEventsByMachine(Long machineId) {

        if (!machineRepository.existsById(machineId)) {
            throw new MachineNotFoundException(machineId);
        }

        return downtimeEventRepository.findByMachineId(machineId);
    }

    public DowntimeEvent createDowntimeEvent(DowntimeEvent downtimeEvent) {

        Long machineId = downtimeEvent.getMachine().getId();

        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new MachineNotFoundException(machineId));

        downtimeEvent.setMachine(machine);

        if (downtimeEvent.getDowntimeReason() != null) {
            Long reasonId = downtimeEvent.getDowntimeReason().getId();
            DowntimeReason downtimeReason =
                    downtimeReasonRepository.findById(reasonId)
                            .orElseThrow(() ->
                                    new DowntimeReasonNotFoundException(reasonId)
                            );
            downtimeEvent.setDowntimeReason(downtimeReason);
        }

        if (downtimeEvent.getResolvedAt() == null) {
            downtimeEvent.setStatus(DowntimeStatus.OPEN);
        } else {
            downtimeEvent.setStatus(DowntimeStatus.RESOLVED);
        }
        downtimeEvent.setId(null);
        return downtimeEventRepository.save(downtimeEvent);
    }

    public DowntimeEvent updateDowntimeEvent(
            Long id,
            DowntimeEvent updatedEvent
    ) {

        DowntimeEvent existingEvent = getDowntimeEventById(id);

        Long machineId = updatedEvent.getMachine().getId();

        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new MachineNotFoundException(machineId));

        existingEvent.setMachine(machine);

        if (updatedEvent.getDowntimeReason() != null) {

            Long reasonId = updatedEvent.getDowntimeReason().getId();

            DowntimeReason downtimeReason =
                    downtimeReasonRepository.findById(reasonId)
                            .orElseThrow(() ->
                                    new DowntimeReasonNotFoundException(reasonId)
                            );

            existingEvent.setDowntimeReason(downtimeReason);

        } else {
            existingEvent.setDowntimeReason(null);
        }

        existingEvent.setFaultReason(updatedEvent.getFaultReason());
        existingEvent.setDescription(updatedEvent.getDescription());
        if (updatedEvent.getResolvedAt() == null) {
            existingEvent.setStatus(DowntimeStatus.OPEN);
        } else {
            existingEvent.setStatus(DowntimeStatus.RESOLVED);
        }
        existingEvent.setOccurredAt(updatedEvent.getOccurredAt());
        existingEvent.setResolvedAt(updatedEvent.getResolvedAt());

        return downtimeEventRepository.save(existingEvent);
    }

    public void deleteDowntimeEvent(Long id) {

        DowntimeEvent downtimeEvent = getDowntimeEventById(id);

        downtimeEventRepository.delete(downtimeEvent);
    }
}