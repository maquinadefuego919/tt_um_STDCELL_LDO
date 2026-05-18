![](../../workflows/gds/badge.svg) ![](../../workflows/docs/badge.svg)

# Low Dropout Regulator digital topology implementation
A standard-cell-based SKY130 LDO regulator implemented using a digital design flow. This project focuses on the integration of Verilog-based control blocks and high-voltage standard cells to achieve low-dropout voltage regulation within the SKY130 process.
## General Description
This repository contains the design collateral for a standard-cell-based LDO regulator targeting the SKY130 design flow using OpenROAD. The project covers the integration of Verilog-based digital control blocks and the sky130_fd_sc_hvl high-voltage standard cell library to implement low-dropout voltage regulation and physical design generation within the SKY130 process.
## Academic Motivation
The design is motivated by research on digital and inverter-based analog circuits for ultra-low-power applications, particularly the work “A 138.39 FoMS, 2.8 nW, 65 dB, Digital-Based OTA for Bio-Signal Processing Applications” by Riccardo Della Sala, Ali Namdari, Orazio Aiello, Daniele D. Caviglia, and Pasquale Tommasino. The project explores the implementation of a standard-cell-based LDO regulator using the SKY130 process and the OpenROAD physical design flow, integrating Verilog-based control logic with the sky130_fd_sc_hvl high-voltage library.
The common-mode feedback loop OTA was inspired by the paper “A Novel Differential to Single-Ended Converter for Ultra-Low-Voltage Inverter-Based OTAs” by Riccardo Della Sala, Francesco Centurelli, and Giuseppe Scotti, developed at the Dipartimento di Ingegneria dell’Informazione, Elettronica e Telecomunicazioni (DIET), Sapienza University of Rome.
This project was developed as part of academic and research activities related to integrated circuit design and physical implementation in the SKY130 open-source ecosystem.
## Project Objectives
Implement a standard-cell-based LDO regulator using the SKY130 open-source PDK and the OpenROAD physical design flow.
Validate voltage regulation functionality and post-layout performance through extracted simulations.
Evaluate low PSRR (Power Supply Rejection Ratio) behavior.
Integrate Verilog-based digital control blocks and the sky130_fd_sc_hvl high-voltage standard cell library within the physical implementation flow.
Export GDS and LEF collateral compatible with the SKY130 open-source design ecosystem.
## Project Summary

| Item | Value |
| --- | --- |
| Top module | `tt_um_STDCELL_LDO` |
| Process | SKY130 |
| Target | Tiny Tapeout analog/custom layout |
| Tile size | `1x2` |
| Design type | Voltage Regulator |
| Implementation style | Openroad Layout generation/Custom |
| Project Supervisor | José Luis Valtierra Sánchez de la Vega |
| Project Participants | Abner José Parra Hernández |

## Design Concept
The circuit consists of an inverter-based OTA topology with a tri-state inverter array acting as the pass-device current stage. The negative output of the OTA block is connected to the control input of the tri-state inverter array, forming a feedback regulation loop.
The original nand3_1 cell used in the common-mode feedback loop was replaced with an auxiliary inverter-based OTA to improve common-mode regulation and compatibility with the digital-based analog architecture. 
## Simulation Results
The circuit was evaluated using post-layout simulations in Xschem and ngspice across a range of input voltages and different load conditions to verify proper voltage regulation behavior.
The simulation results demonstrate stable output regulation. Additional analyses were performed to evaluate the PSRR performance and the behavior of the inverter-based OTA and common-mode feedback loop under post-layout extracted conditions.
## Layout Strategy
The physical implementation was performed using an OpenROAD design flow together with the SKY130 open-source PDK and the sky130_fd_sc_hvl high-voltage standard cell library.
At the output of the tri-state inverter array block, the output connections were manually merged to increase the effective metal width and support higher current handling capability.
Although the design follows an automated digital implementation flow, post-layout verification and custom integration steps were required to ensure proper analog behavior, voltage regulation stability, and compatibility between the generated GDS, LEF, and DEF collateral.

## Repository Structure
src/project.v: Tiny Tapeout wrapper module.
gds/: Final GDS files.
lef/: LEF abstracts for the Tiny Tapeout flow.
xschem/: Schematic capture files.
mag/: Magic layout files.

## Acknowledgments
This project was developed at the Faculty of Engineering Mexicali, Universidad Autónoma de Baja California (UABC), within the Semiconductors and Microelectronics program. We acknowledge the use of the SKY130 process and the Tiny Tapeout platform for enabling open-source silicon fabrication.
