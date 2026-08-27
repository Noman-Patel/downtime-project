package com.example.downtime.Service;

import com.example.downtime.Entities.Department;
import com.example.downtime.Entities.ProductionLine;
import com.example.downtime.Exception.DepartmentNotFoundException;
import com.example.downtime.Exception.ProductionLineNotFoundException;
import com.example.downtime.Repository.DepartmentRepository;
import com.example.downtime.Repository.ProductionLineRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductionLineService {

    private final ProductionLineRepository productionLineRepository;
    private final DepartmentRepository departmentRepository;

    public ProductionLineService(
            ProductionLineRepository productionLineRepository,
            DepartmentRepository departmentRepository
    ) {
        this.productionLineRepository = productionLineRepository;
        this.departmentRepository = departmentRepository;
    }

    public List<ProductionLine> getAllProductionLines() {
        return productionLineRepository.findAll();
    }

    public ProductionLine getProductionLineById(Long id) {
        return productionLineRepository.findById(id)
                .orElseThrow(() -> new ProductionLineNotFoundException(id));
    }

    public ProductionLine createProductionLine(ProductionLine productionLine) {

        Long departmentId = productionLine.getDepartment().getId();

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() ->
                        new DepartmentNotFoundException(departmentId)
                );

        productionLine.setDepartment(department);
        productionLine.setId(null);

        return productionLineRepository.save(productionLine);
    }

    public ProductionLine updateProductionLine(
            Long id,
            ProductionLine updatedProductionLine
    ) {

        ProductionLine existingProductionLine =
                productionLineRepository.findById(id)
                        .orElseThrow(() ->
                                new ProductionLineNotFoundException(id)
                        );

        Long departmentId =
                updatedProductionLine.getDepartment().getId();

        Department department =
                departmentRepository.findById(departmentId)
                        .orElseThrow(() ->
                                new DepartmentNotFoundException(departmentId)
                        );

        existingProductionLine.setDepartment(department);
        existingProductionLine.setName(
                updatedProductionLine.getName()
        );
        existingProductionLine.setLocation(
                updatedProductionLine.getLocation()
        );

        return productionLineRepository.save(
                existingProductionLine
        );
    }

    public void deleteProductionLine(Long id) {

        ProductionLine productionLine =
                productionLineRepository.findById(id)
                        .orElseThrow(() ->
                                new ProductionLineNotFoundException(id)
                        );

        productionLineRepository.delete(productionLine);
    }
}