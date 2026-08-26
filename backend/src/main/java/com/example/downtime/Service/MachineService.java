package com.example.downtime.Service;

import com.example.downtime.Entities.Machine;
import com.example.downtime.Entities.ProductionLine;
import com.example.downtime.Exception.MachineNotFoundException;
import com.example.downtime.Exception.ProductionLineNotFoundException;
import com.example.downtime.Repository.MachineRepository;
import com.example.downtime.Repository.ProductionLineRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MachineService {

    private final MachineRepository machineRepository;

    private final ProductionLineRepository productionLineRepository;

    public MachineService(MachineRepository machineRepository, ProductionLineRepository productionLineRepository) {
        this.machineRepository = machineRepository;
        this.productionLineRepository = productionLineRepository;
    }

    public List<Machine> getAllMachines() {
        return machineRepository.findAll();
    }
    public Machine createMachine(Machine machine) {
        Long productionLineId = machine.getProductionLine().getId();
        ProductionLine productionLine = productionLineRepository.findById(productionLineId)
                .orElseThrow(() -> new ProductionLineNotFoundException(productionLineId));

        machine.setProductionLine(productionLine);
        return machineRepository.save(machine);
    }

    public Machine getMachineById(Long id) {
        return machineRepository.findById(id)
                .orElseThrow(() -> new MachineNotFoundException(id));
    }


    public Machine updateMachine(Long id, Machine updatedMachine) {

        Machine existingMachine = machineRepository.findById(id)
                .orElseThrow(() -> new MachineNotFoundException(id));

        existingMachine.setName(updatedMachine.getName());
        existingMachine.setType(updatedMachine.getType());
        existingMachine.setLocation(updatedMachine.getLocation());

        if (updatedMachine.getProductionLine() != null) {
            Long productionLineId = updatedMachine.getProductionLine().getId();
            ProductionLine productionLine = productionLineRepository.findById(productionLineId)
                    .orElseThrow(() -> new ProductionLineNotFoundException(productionLineId));
            existingMachine.setProductionLine(productionLine);
        }
        return machineRepository.save(existingMachine);
    }

    public void deleteMachine(Long id) {
        Machine machine = machineRepository.findById(id)
                .orElseThrow(() -> new MachineNotFoundException(id));
        machineRepository.delete(machine);
    }
}