package com.example.downtime.Service;

import com.example.downtime.Entities.DowntimeEvent;
import com.example.downtime.Entities.Machine;
import com.example.downtime.Exception.DowntimeEventNotFoundException;
import com.example.downtime.Exception.MachineNotFoundException;
import com.example.downtime.Repository.DowntimeEventRepository;
import com.example.downtime.Repository.MachineRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DowntimeEventService {

    private final DowntimeEventRepository downtimeEventRepository;
    private final MachineRepository machineRepository;

    public DowntimeEventService(
            DowntimeEventRepository downtimeEventRepository,
            MachineRepository machineRepository) {

        this.downtimeEventRepository = downtimeEventRepository;
        this.machineRepository = machineRepository;
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

        return downtimeEventRepository.save(downtimeEvent);
    }

    public DowntimeEvent updateDowntimeEvent(
            Long id,
            DowntimeEvent updatedDowntimeEvent) {

        DowntimeEvent existingEvent = downtimeEventRepository.findById(id)
                .orElseThrow(() -> new DowntimeEventNotFoundException(id));

        existingEvent.setFaultReason(updatedDowntimeEvent.getFaultReason());
        existingEvent.setDescription(updatedDowntimeEvent.getDescription());
        existingEvent.setStatus(updatedDowntimeEvent.getStatus());
        existingEvent.setOccurredAt(updatedDowntimeEvent.getOccurredAt());
        existingEvent.setResolvedAt(updatedDowntimeEvent.getResolvedAt());

        if (updatedDowntimeEvent.getMachine() != null) {

            Long machineId = updatedDowntimeEvent.getMachine().getId();

            Machine machine = machineRepository.findById(machineId)
                    .orElseThrow(() -> new MachineNotFoundException(machineId));

            existingEvent.setMachine(machine);
        }

        return downtimeEventRepository.save(existingEvent);
    }

    public void deleteDowntimeEvent(Long id) {

        DowntimeEvent downtimeEvent = downtimeEventRepository.findById(id)
                .orElseThrow(() -> new DowntimeEventNotFoundException(id));

        downtimeEventRepository.delete(downtimeEvent);
    }
}