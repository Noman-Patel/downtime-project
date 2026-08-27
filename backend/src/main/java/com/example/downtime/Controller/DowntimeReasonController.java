package com.example.downtime.Controller;

import com.example.downtime.Entities.DowntimeReason;
import com.example.downtime.Service.DowntimeReasonService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/downtime-reasons")
public class DowntimeReasonController {

    private final DowntimeReasonService downtimeReasonService;

    public DowntimeReasonController(
            DowntimeReasonService downtimeReasonService
    ) {
        this.downtimeReasonService = downtimeReasonService;
    }

    @GetMapping
    public List<DowntimeReason> getAllDowntimeReasons() {
        return downtimeReasonService.getAllDowntimeReasons();
    }

    @GetMapping("/{id}")
    public DowntimeReason getDowntimeReasonById(
            @PathVariable Long id
    ) {
        return downtimeReasonService.getDowntimeReasonById(id);
    }

    @PostMapping
    public ResponseEntity<DowntimeReason> createDowntimeReason(
            @RequestBody DowntimeReason downtimeReason
    ) {
        DowntimeReason createdReason =
                downtimeReasonService.createDowntimeReason(
                        downtimeReason
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdReason);
    }

    @PutMapping("/{id}")
    public DowntimeReason updateDowntimeReason(
            @PathVariable Long id,
            @RequestBody DowntimeReason downtimeReason
    ) {
        return downtimeReasonService.updateDowntimeReason(
                id,
                downtimeReason
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDowntimeReason(
            @PathVariable Long id
    ) {
        downtimeReasonService.deleteDowntimeReason(id);

        return ResponseEntity.noContent().build();
    }
}