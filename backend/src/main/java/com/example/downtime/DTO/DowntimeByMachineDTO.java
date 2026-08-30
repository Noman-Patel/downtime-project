package com.example.downtime.DTO;

public class DowntimeByMachineDTO {

    private Long machineId;
    private String machineName;
    private long downtimeEvents;

    public DowntimeByMachineDTO(
            Long machineId,
            String machineName,
            long downtimeEvents) {

        this.machineId = machineId;
        this.machineName = machineName;
        this.downtimeEvents = downtimeEvents;
    }

    public Long getMachineId() {
        return machineId;
    }

    public String getMachineName() {
        return machineName;
    }

    public long getDowntimeEvents() {
        return downtimeEvents;
    }
}