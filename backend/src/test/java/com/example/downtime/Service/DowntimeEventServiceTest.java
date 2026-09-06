package com.example.downtime.Service;

import com.example.downtime.DTO.DowntimeEventRequestDTO;
import com.example.downtime.Entities.DowntimeEvent;
import com.example.downtime.Entities.DowntimeStatus;
import com.example.downtime.Entities.Machine;
import com.example.downtime.Exception.InvalidDowntimeDateRangeException;
import com.example.downtime.Repository.DowntimeEventRepository;
import com.example.downtime.Repository.DowntimeReasonRepository;
import com.example.downtime.Repository.MachineRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DowntimeEventServiceTest {

    @Mock
    private DowntimeEventRepository downtimeEventRepository;

    @Mock
    private MachineRepository machineRepository;

    @Mock
    private DowntimeReasonRepository downtimeReasonRepository;

    private DowntimeEventService downtimeEventService;

    @BeforeEach
    void setUp() {
        downtimeEventService = new DowntimeEventService(
                downtimeEventRepository,
                machineRepository,
                downtimeReasonRepository
        );
    }

    @Test
    void createWithoutResolutionCreatesOpenEvent() {
        Machine machine = machine(7L);
        DowntimeEventRequestDTO request = request(
                7L,
                LocalDateTime.of(2026, 9, 6, 8, 30),
                null
        );
        when(machineRepository.findById(7L)).thenReturn(Optional.of(machine));
        when(downtimeEventRepository.save(any(DowntimeEvent.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        DowntimeEvent savedEvent = downtimeEventService.createDowntimeEvent(request);

        assertSame(machine, savedEvent.getMachine());
        assertEquals(DowntimeStatus.OPEN, savedEvent.getStatus());
        assertEquals(request.getOccurredAt(), savedEvent.getOccurredAt());
        assertNull(savedEvent.getResolvedAt());
        assertNull(savedEvent.getDowntimeReason());
        verify(downtimeEventRepository).save(savedEvent);
        verifyNoInteractions(downtimeReasonRepository);
    }

    @Test
    void createWithResolutionCreatesResolvedEvent() {
        Machine machine = machine(11L);
        LocalDateTime occurredAt = LocalDateTime.of(2026, 9, 6, 9, 0);
        LocalDateTime resolvedAt = occurredAt.plusMinutes(42);
        DowntimeEventRequestDTO request = request(11L, occurredAt, resolvedAt);
        when(machineRepository.findById(11L)).thenReturn(Optional.of(machine));
        when(downtimeEventRepository.save(any(DowntimeEvent.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        DowntimeEvent savedEvent = downtimeEventService.createDowntimeEvent(request);

        assertEquals(DowntimeStatus.RESOLVED, savedEvent.getStatus());
        assertEquals(resolvedAt, savedEvent.getResolvedAt());
        verify(downtimeEventRepository).save(savedEvent);
    }

    @Test
    void updateOpenEventWithResolutionMarksItResolved() {
        Machine machine = machine(3L);
        LocalDateTime occurredAt = LocalDateTime.of(2026, 9, 6, 10, 15);
        LocalDateTime resolvedAt = occurredAt.plusHours(1);
        DowntimeEvent existingEvent = new DowntimeEvent();
        existingEvent.setId(19L);
        existingEvent.setMachine(machine);
        existingEvent.setStatus(DowntimeStatus.OPEN);
        existingEvent.setOccurredAt(occurredAt);
        DowntimeEventRequestDTO request = request(3L, occurredAt, resolvedAt);

        when(downtimeEventRepository.findById(19L)).thenReturn(Optional.of(existingEvent));
        when(machineRepository.findById(3L)).thenReturn(Optional.of(machine));
        when(downtimeEventRepository.save(existingEvent)).thenReturn(existingEvent);

        DowntimeEvent savedEvent = downtimeEventService.updateDowntimeEvent(19L, request);

        assertSame(existingEvent, savedEvent);
        assertEquals(DowntimeStatus.RESOLVED, savedEvent.getStatus());
        assertEquals(resolvedAt, savedEvent.getResolvedAt());
        verify(downtimeEventRepository).save(existingEvent);
    }

    @Test
    void updateResolvedEventWithoutResolutionMarksItOpen() {
        Machine machine = machine(13L);
        LocalDateTime occurredAt = LocalDateTime.of(2026, 9, 6, 11, 30);
        DowntimeEvent existingEvent = new DowntimeEvent();
        existingEvent.setId(22L);
        existingEvent.setMachine(machine);
        existingEvent.setStatus(DowntimeStatus.RESOLVED);
        existingEvent.setOccurredAt(occurredAt);
        existingEvent.setResolvedAt(occurredAt.plusMinutes(20));
        DowntimeEventRequestDTO request = request(13L, occurredAt, null);

        when(downtimeEventRepository.findById(22L)).thenReturn(Optional.of(existingEvent));
        when(machineRepository.findById(13L)).thenReturn(Optional.of(machine));
        when(downtimeEventRepository.save(existingEvent)).thenReturn(existingEvent);

        DowntimeEvent savedEvent = downtimeEventService.updateDowntimeEvent(22L, request);

        assertEquals(DowntimeStatus.OPEN, savedEvent.getStatus());
        assertNull(savedEvent.getResolvedAt());
        verify(downtimeEventRepository).save(existingEvent);
    }

    @Test
    @SuppressWarnings("unchecked")
    void searchAndFiltersUseNewestFirstRepositorySort() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 9, 6, 23, 59);
        List<DowntimeEvent> expectedEvents = List.of(new DowntimeEvent());
        when(downtimeEventRepository.findAll(
                any(Specification.class),
                any(Sort.class)
        )).thenReturn(expectedEvents);

        List<DowntimeEvent> actualEvents = downtimeEventService.getDowntimeEvents(
                "motor overload",
                5L,
                8L,
                2L,
                DowntimeStatus.RESOLVED,
                start,
                end
        );

        ArgumentCaptor<Specification<DowntimeEvent>> specificationCaptor =
                ArgumentCaptor.forClass(Specification.class);
        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        verify(downtimeEventRepository).findAll(
                specificationCaptor.capture(),
                sortCaptor.capture()
        );

        Sort sort = sortCaptor.getValue();
        assertNotNull(specificationCaptor.getValue());
        assertEquals(Sort.Direction.DESC, sort.getOrderFor("occurredAt").getDirection());
        assertEquals(Sort.Direction.DESC, sort.getOrderFor("id").getDirection());
        assertEquals(expectedEvents, actualEvents);
    }

    @Test
    void createRejectsResolutionBeforeOccurrence() {
        LocalDateTime occurredAt = LocalDateTime.of(2026, 9, 6, 12, 0);
        DowntimeEventRequestDTO request = request(
                4L,
                occurredAt,
                occurredAt.minusMinutes(1)
        );

        assertThrows(
                InvalidDowntimeDateRangeException.class,
                () -> downtimeEventService.createDowntimeEvent(request)
        );

        verifyNoInteractions(
                downtimeEventRepository,
                machineRepository,
                downtimeReasonRepository
        );
    }

    @Test
    void searchRejectsStartAfterEnd() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 7, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 9, 6, 0, 0);

        assertThrows(
                InvalidDowntimeDateRangeException.class,
                () -> downtimeEventService.getDowntimeEvents(
                        null,
                        null,
                        null,
                        null,
                        null,
                        start,
                        end
                )
        );

        verifyNoInteractions(downtimeEventRepository);
    }

    private static Machine machine(Long id) {
        Machine machine = new Machine();
        machine.setId(id);
        machine.setName("Press " + id);
        return machine;
    }

    private static DowntimeEventRequestDTO request(
            Long machineId,
            LocalDateTime occurredAt,
            LocalDateTime resolvedAt
    ) {
        DowntimeEventRequestDTO request = new DowntimeEventRequestDTO();
        request.setMachineId(machineId);
        request.setFaultReason("Motor overload");
        request.setDescription("Reset the overload relay and inspected the drive.");
        request.setOccurredAt(occurredAt);
        request.setResolvedAt(resolvedAt);
        return request;
    }
}
