package com.example.downtime.Controller;

import com.example.downtime.DTO.DashboardSummaryDTO;
import com.example.downtime.DTO.DowntimeByMachineDTO;
import com.example.downtime.DTO.DowntimeByReasonDTO;
import com.example.downtime.Service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public DashboardSummaryDTO getSummary() {
        return dashboardService.getSummary();
    }

    @GetMapping("/downtime-by-reason")
    public List<DowntimeByReasonDTO> getDowntimeByReason() {
        return dashboardService.getDowntimeByReason();
    }

    @GetMapping("/downtime-by-machine")
    public List<DowntimeByMachineDTO> getDowntimeByMachine() {
        return dashboardService.getDowntimeByMachine();
    }
}