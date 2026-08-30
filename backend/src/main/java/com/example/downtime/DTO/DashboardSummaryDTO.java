package com.example.downtime.DTO;

public class DashboardSummaryDTO {

    private long totalDowntimeEvents;
    private long openDowntimeEvents;
    private long resolvedDowntimeEvents;
    private long totalMachines;
    private long totalDowntimeMinutes;

    public DashboardSummaryDTO(
            long totalDowntimeEvents,
            long openDowntimeEvents,
            long resolvedDowntimeEvents,
            long totalMachines,
            long totalDowntimeMinutes) {

        this.totalDowntimeEvents = totalDowntimeEvents;
        this.openDowntimeEvents = openDowntimeEvents;
        this.resolvedDowntimeEvents = resolvedDowntimeEvents;
        this.totalMachines = totalMachines;
        this.totalDowntimeMinutes = totalDowntimeMinutes;
    }

    public long getTotalDowntimeEvents() {
        return totalDowntimeEvents;
    }

    public long getOpenDowntimeEvents() {
        return openDowntimeEvents;
    }

    public long getResolvedDowntimeEvents() {
        return resolvedDowntimeEvents;
    }

    public long getTotalMachines() {
        return totalMachines;
    }

    public long getTotalDowntimeMinutes() {
        return totalDowntimeMinutes;
    }
}