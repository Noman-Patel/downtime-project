package com.example.downtime.Service;

import com.example.downtime.Entities.Machine;
import com.example.downtime.Repository.MachineRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MachineService {

    private final MachineRepository machineRepository;

    public MachineService(MachineRepository machineRepository) {
        this.machineRepository = machineRepository;
    }

    public List<Machine> getAllMachines() {
        return machineRepository.findAll();
    }

    public Machine createMachine(Machine machine) {
        return machineRepository.save(machine);
    }
}