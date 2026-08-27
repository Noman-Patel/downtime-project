package com.example.downtime.Service;

import com.example.downtime.DTO.DowntimeEventRequestDTO;
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
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
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



    public List<DowntimeEvent> getDowntimeEvents(
            Long machineId,
            DowntimeStatus status,
            LocalDateTime start,
            LocalDateTime end) {

        Specification<DowntimeEvent> specification =
                (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();

        if (machineId != null) {
            specification = specification.and(
                    (root, query, criteriaBuilder) ->
                            criteriaBuilder.equal(
                                    root.get("machine").get("id"),
                                    machineId
                            )
            );
        }

        if (status != null) {
            specification = specification.and(
                    (root, query, criteriaBuilder) ->
                            criteriaBuilder.equal(
                                    root.get("status"),
                                    status
                            )
            );
        }

        if (start != null) {
            specification = specification.and(
                    (root, query, criteriaBuilder) ->
                            criteriaBuilder.greaterThanOrEqualTo(
                                    root.get("occurredAt"),
                                    start
                            )
            );
        }

        if (end != null) {
            specification = specification.and(
                    (root, query, criteriaBuilder) ->
                            criteriaBuilder.lessThanOrEqualTo(
                                    root.get("occurredAt"),
                                    end
                            )
            );
        }

        return downtimeEventRepository.findAll(specification);
    }


    public DowntimeEvent getDowntimeEventById(Long id) {
        return downtimeEventRepository.findById(id)
                .orElseThrow(() -> new DowntimeEventNotFoundException(id));
    }


    public DowntimeEvent createDowntimeEvent(
            DowntimeEventRequestDTO request
    ) {

        Machine machine = machineRepository.findById(request.getMachineId())
                .orElseThrow(() ->
                        new MachineNotFoundException(request.getMachineId())
                );

        DowntimeReason downtimeReason = null;

        if (request.getDowntimeReasonId() != null) {
            downtimeReason = downtimeReasonRepository
                    .findById(request.getDowntimeReasonId())
                    .orElseThrow(() ->
                            new DowntimeReasonNotFoundException(
                                    request.getDowntimeReasonId()
                            )
                    );
        }

        DowntimeEvent downtimeEvent = new DowntimeEvent();

        downtimeEvent.setMachine(machine);
        downtimeEvent.setDowntimeReason(downtimeReason);
        downtimeEvent.setFaultReason(request.getFaultReason());
        downtimeEvent.setDescription(request.getDescription());
        downtimeEvent.setOccurredAt(request.getOccurredAt());
        downtimeEvent.setResolvedAt(request.getResolvedAt());

        if (request.getResolvedAt() == null) {
            downtimeEvent.setStatus(DowntimeStatus.OPEN);
        } else {
            downtimeEvent.setStatus(DowntimeStatus.RESOLVED);
        }

        return downtimeEventRepository.save(downtimeEvent);
    }

    public DowntimeEvent updateDowntimeEvent(
            Long id,
            DowntimeEventRequestDTO request
    ) {

        DowntimeEvent existingEvent = getDowntimeEventById(id);

        Machine machine = machineRepository.findById(request.getMachineId())
                .orElseThrow(() ->
                        new MachineNotFoundException(request.getMachineId())
                );

        existingEvent.setMachine(machine);

        if (request.getDowntimeReasonId() != null) {

            DowntimeReason downtimeReason =
                    downtimeReasonRepository
                            .findById(request.getDowntimeReasonId())
                            .orElseThrow(() ->
                                    new DowntimeReasonNotFoundException(
                                            request.getDowntimeReasonId()
                                    )
                            );

            existingEvent.setDowntimeReason(downtimeReason);

        } else {
            existingEvent.setDowntimeReason(null);
        }

        existingEvent.setFaultReason(request.getFaultReason());
        existingEvent.setDescription(request.getDescription());
        existingEvent.setOccurredAt(request.getOccurredAt());
        existingEvent.setResolvedAt(request.getResolvedAt());

        if (request.getResolvedAt() == null) {
            existingEvent.setStatus(DowntimeStatus.OPEN);
        } else {
            existingEvent.setStatus(DowntimeStatus.RESOLVED);
        }

        return downtimeEventRepository.save(existingEvent);
    }

    public void deleteDowntimeEvent(Long id) {

        DowntimeEvent downtimeEvent = getDowntimeEventById(id);

        downtimeEventRepository.delete(downtimeEvent);
    }
}