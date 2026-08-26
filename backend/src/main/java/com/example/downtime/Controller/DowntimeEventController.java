package com.example.downtime.Controller;

import com.example.downtime.Entities.DowntimeEvent;
import com.example.downtime.Service.DowntimeEventService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/downtime-events")
public class DowntimeEventController {

    private final DowntimeEventService downtimeEventService;

    public DowntimeEventController(DowntimeEventService downtimeEventService) {
        this.downtimeEventService = downtimeEventService;
    }

    @GetMapping
    public List<DowntimeEvent> getAllDowntimeEvents() {
        return downtimeEventService.getAllDowntimeEvents();
    }

    @GetMapping("/{id}")
    public DowntimeEvent getDowntimeEventById(@PathVariable Long id) {
        return downtimeEventService.getDowntimeEventById(id);
    }

    @GetMapping("/machine/{machineId}")
    public List<DowntimeEvent> getDowntimeEventsByMachine(
            @PathVariable Long machineId) {

        return downtimeEventService.getDowntimeEventsByMachine(machineId);
    }

    @PostMapping
    public DowntimeEvent createDowntimeEvent(
            @Valid @RequestBody DowntimeEvent downtimeEvent) {

        return downtimeEventService.createDowntimeEvent(downtimeEvent);
    }

    @PutMapping("/{id}")
    public DowntimeEvent updateDowntimeEvent(
            @PathVariable Long id,
            @Valid @RequestBody DowntimeEvent downtimeEvent) {

        return downtimeEventService.updateDowntimeEvent(id, downtimeEvent);
    }

    @DeleteMapping("/{id}")
    public void deleteDowntimeEvent(@PathVariable Long id) {
        downtimeEventService.deleteDowntimeEvent(id);
    }
}