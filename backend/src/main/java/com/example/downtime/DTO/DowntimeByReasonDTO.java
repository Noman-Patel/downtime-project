package com.example.downtime.DTO;

public class DowntimeByReasonDTO {

    private String reason;
    private long count;

    public DowntimeByReasonDTO(String reason, long count) {
        this.reason = reason;
        this.count = count;
    }

    public String getReason() {
        return reason;
    }

    public long getCount() {
        return count;
    }
}