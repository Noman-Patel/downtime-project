package com.example.downtime.Controller;

import com.example.downtime.Entities.ProductionLine;
import com.example.downtime.Service.ProductionLineService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/production-lines")
public class ProductionLineController {

    private final ProductionLineService productionLineService;

    public ProductionLineController(ProductionLineService productionLineService) {
        this.productionLineService = productionLineService;
    }

    @GetMapping
    public List<ProductionLine> getAllProductionLines() {
        return productionLineService.getAllProductionLines();
    }

    @GetMapping("/{id}")
    public ProductionLine getProductionLineById(@PathVariable Long id) {
        return productionLineService.getProductionLineById(id);
    }


    @PostMapping
    public ProductionLine createProductionLine(
            @Valid @RequestBody ProductionLine productionLine) {

        return productionLineService.createProductionLine(productionLine);
    }

    @PutMapping("/{id}")
    public ProductionLine updateProductionLine(
            @PathVariable Long id,
            @Valid @RequestBody ProductionLine productionLine) {

        return productionLineService.updateProductionLine(id, productionLine);
    }

    @DeleteMapping("/{id}")
    public void deleteProductionLine(@PathVariable Long id) {
        productionLineService.deleteProductionLine(id);
    }
}