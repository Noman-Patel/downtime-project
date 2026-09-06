package com.example.downtime.Service;

import com.example.downtime.DTO.DowntimeEventRequestDTO;
import com.example.downtime.Entities.DowntimeEvent;
import com.example.downtime.Entities.DowntimeReason;
import com.example.downtime.Entities.DowntimeStatus;
import com.example.downtime.Entities.Machine;
import com.example.downtime.Exception.DowntimeEventNotFoundException;
import com.example.downtime.Exception.DowntimeReasonNotFoundException;
import com.example.downtime.Exception.InvalidDowntimeDateRangeException;
import com.example.downtime.Exception.MachineNotFoundException;
import com.example.downtime.Repository.DowntimeEventRepository;
import com.example.downtime.Repository.DowntimeReasonRepository;
import com.example.downtime.Repository.MachineRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

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
            String q,
            Long machineId,
            Long downtimeReasonId,
            Long productionLineId,
            DowntimeStatus status,
            LocalDateTime start,
            LocalDateTime end) {

        validateFilterDateRange(start, end);

        Specification<DowntimeEvent> specification =
                (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();

        if (q != null && !q.isBlank()) {
            String searchTerm = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and(
                    (root, query, criteriaBuilder) -> criteriaBuilder.or(
                            criteriaBuilder.like(
                                    criteriaBuilder.lower(root.get("faultReason")),
                                    searchTerm
                            ),
                            criteriaBuilder.like(
                                    criteriaBuilder.lower(root.get("description")),
                                    searchTerm
                            )
                    )
            );
        }

        if (machineId != null) {
            specification = specification.and(
                    (root, query, criteriaBuilder) ->
                            criteriaBuilder.equal(
                                    root.get("machine").get("id"),
                                    machineId
                            )
            );
        }

        if (downtimeReasonId != null) {
            specification = specification.and(
                    (root, query, criteriaBuilder) ->
                            criteriaBuilder.equal(
                                    root.get("downtimeReason").get("id"),
                                    downtimeReasonId
                            )
            );
        }

        if (productionLineId != null) {
            specification = specification.and(
                    (root, query, criteriaBuilder) ->
                            criteriaBuilder.equal(
                                    root.get("machine").get("productionLine").get("id"),
                                    productionLineId
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

        return downtimeEventRepository.findAll(
                specification,
                Sort.by(Sort.Direction.DESC, "occurredAt")
                        .and(Sort.by(Sort.Direction.DESC, "id"))
        );
    }


    public DowntimeEvent getDowntimeEventById(Long id) {
        return downtimeEventRepository.findById(id)
                .orElseThrow(() -> new DowntimeEventNotFoundException(id));
    }


    public DowntimeEvent createDowntimeEvent(
            DowntimeEventRequestDTO request
    ) {

        validateEventDateRange(request.getOccurredAt(), request.getResolvedAt());

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

        validateEventDateRange(request.getOccurredAt(), request.getResolvedAt());

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

    private void validateEventDateRange(
            LocalDateTime occurredAt,
            LocalDateTime resolvedAt
    ) {
        if (occurredAt != null
                && resolvedAt != null
                && resolvedAt.isBefore(occurredAt)) {
            throw new InvalidDowntimeDateRangeException(
                    "Resolved at cannot be earlier than occurred at"
            );
        }
    }

    private void validateFilterDateRange(
            LocalDateTime start,
            LocalDateTime end
    ) {
        if (start != null && end != null && start.isAfter(end)) {
            throw new InvalidDowntimeDateRangeException(
                    "Start date cannot be after end date"
            );
        }
    }
}
