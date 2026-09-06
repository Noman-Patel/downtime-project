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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.StreamSupport;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DemoDataInitializerTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private ProductionLineRepository productionLineRepository;

    @Mock
    private MachineRepository machineRepository;

    @Mock
    private DowntimeEventRepository downtimeEventRepository;

    private DemoDataInitializer initializer;

    @BeforeEach
    void setUp() {
        initializer = new DemoDataInitializer(
                departmentRepository,
                productionLineRepository,
                machineRepository,
                downtimeEventRepository
        );
    }

    @Test
    void seedsACompleteSearchableDatasetWhenAllCoreTablesAreEmpty() {
        when(departmentRepository.save(any(Department.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(productionLineRepository.save(any(ProductionLine.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(machineRepository.save(any(Machine.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        LocalDateTime testStartedAt = LocalDateTime.now();

        initializer.run(null);

        verify(departmentRepository, times(3)).save(any(Department.class));
        verify(productionLineRepository, times(4)).save(any(ProductionLine.class));
        verify(machineRepository, times(8)).save(any(Machine.class));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Iterable<DowntimeEvent>> eventsCaptor =
                ArgumentCaptor.forClass(Iterable.class);
        verify(downtimeEventRepository).saveAll(eventsCaptor.capture());

        List<DowntimeEvent> events = StreamSupport.stream(
                eventsCaptor.getValue().spliterator(),
                false
        ).toList();

        assertEquals(14, events.size());
        assertEquals(
                8,
                events.stream().map(event -> event.getMachine().getName()).distinct().count()
        );
        assertEquals(
                4,
                events.stream().filter(event -> event.getStatus() == DowntimeStatus.OPEN).count()
        );
        assertEquals(
                10,
                events.stream().filter(event -> event.getStatus() == DowntimeStatus.RESOLVED).count()
        );
        assertTrue(events.stream().allMatch(event -> event.getOccurredAt().isBefore(testStartedAt)));
        assertTrue(events.stream().allMatch(event -> {
            if (event.getStatus() == DowntimeStatus.OPEN) {
                return event.getResolvedAt() == null;
            }
            return event.getResolvedAt() != null
                    && event.getResolvedAt().isAfter(event.getOccurredAt());
        }));
        assertTrue(events.stream().allMatch(event -> event.getDowntimeReason() == null));
        assertTrue(keywordCount(events, "motor overload") >= 4);
        assertTrue(keywordCount(events, "bearing") >= 3);
        assertTrue(keywordCount(events, "sensor") >= 4);
    }

    @Test
    void preservesExistingDataAndDoesNotPartiallySeed() {
        when(productionLineRepository.count()).thenReturn(1L);

        initializer.run(null);

        verify(departmentRepository).count();
        verify(productionLineRepository).count();
        verify(machineRepository).count();
        verify(downtimeEventRepository).count();
        verify(departmentRepository, never()).save(any(Department.class));
        verify(productionLineRepository, never()).save(any(ProductionLine.class));
        verify(machineRepository, never()).save(any(Machine.class));
        verify(downtimeEventRepository, never()).saveAll(any());
    }

    private static long keywordCount(List<DowntimeEvent> events, String keyword) {
        return events.stream()
                .filter(event -> (
                        event.getFaultReason() + " " + event.getDescription()
                ).toLowerCase().contains(keyword))
                .count();
    }
}
