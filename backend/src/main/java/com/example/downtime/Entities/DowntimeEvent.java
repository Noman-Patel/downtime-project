package com.example.downtime.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "downtime_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DowntimeEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String faultReason;

    private String description;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private LocalDateTime occurredAt;

    private LocalDateTime resolvedAt;

    @ManyToOne
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;
}