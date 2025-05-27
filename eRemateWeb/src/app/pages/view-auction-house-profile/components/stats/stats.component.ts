import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule,
    ChartModule
  ],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss'
})
export class StatsComponent implements OnInit {
  // Datos de ventas mensuales
  salesData: any;
  
  // Datos de categorías más vendidas
  categoryData: any;
  
  // Datos de pujas por subasta
  bidsData: any;
  
  // Datos de compradores frecuentes
  buyersData: any;
  
  // Opciones para los gráficos
  barOptions: any;
  pieOptions: any;
  lineOptions: any;
  doughnutOptions: any;

  ngOnInit() {
    this.initChartData();
    this.initChartOptions();
  }

  initChartData() {
    // Datos de ventas mensuales
    this.salesData = {
      labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
      datasets: [
        {
          label: 'Ventas 2025',
          backgroundColor: '#42A5F5',
          data: [65, 59, 80, 81, 56, 55]
        },
        {
          label: 'Ventas 2024',
          backgroundColor: '#FFA726',
          data: [28, 48, 40, 19, 86, 27]
        }
      ]
    };

    // Datos de categorías más vendidas
    this.categoryData = {
      labels: ['Antigüedades', 'Arte', 'Vehículos', 'Inmuebles', 'Joyas'],
      datasets: [
        {
          data: [300, 250, 200, 150, 100],
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF'
          ]
        }
      ]
    };

    // Datos de pujas por subasta
    this.bidsData = {
      labels: ['Subasta 1', 'Subasta 2', 'Subasta 3', 'Subasta 4', 'Subasta 5', 'Subasta 6'],
      datasets: [
        {
          label: 'Número de pujas',
          data: [28, 48, 40, 65, 59, 76],
          fill: false,
          borderColor: '#4BC0C0',
          tension: 0.4
        }
      ]
    };

    // Datos de compradores frecuentes
    this.buyersData = {
      labels: ['Nuevos', 'Ocasionales', 'Frecuentes', 'Premium'],
      datasets: [
        {
          data: [30, 40, 20, 10],
          backgroundColor: [
            '#9CCC65',
            '#FFCA28',
            '#26C6DA',
            '#EC407A'
          ]
        }
      ]
    };
  }

  initChartOptions() {
    // Opciones comunes
    const commonOptions = {
      plugins: {
        legend: {
          labels: {
            color: '#495057'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#495057'
          },
          grid: {
            color: '#ebedef'
          }
        },
        y: {
          ticks: {
            color: '#495057'
          },
          grid: {
            color: '#ebedef'
          }
        }
      },
      animation: {
        animateScale: true,
        animateRotate: true
      }
    };

    this.barOptions = {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        title: {
          display: true,
          text: 'Comparación de ventas mensuales',
          font: {
            size: 16
          }
        }
      }
    };

    this.pieOptions = {
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#495057'
          }
        },
        title: {
          display: true,
          text: 'Distribución por categoría',
          font: {
            size: 16
          }
        }
      }
    };

    this.lineOptions = {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        title: {
          display: true,
          text: 'Tendencia de pujas',
          font: {
            size: 16
          }
        }
      }
    };

    this.doughnutOptions = {
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#495057'
          }
        },
        title: {
          display: true,
          text: 'Segmentación de compradores',
          font: {
            size: 16
          }
        }
      },
      cutout: '60%'
    };
  }
}
