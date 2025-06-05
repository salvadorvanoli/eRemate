import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner'; // ✅ Agregar esta importación
import { AuctionHouseService } from '../../../../core/services/auction-house.service';
import { SecurityService } from '../../../../core/services/security.service';
import { UsuarioCasaDeRemates } from '../../../../core/models/usuario';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule,
    ChartModule,
    ProgressSpinnerModule // ✅ Agregar aquí
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
  
  // Opciones para los gráficos
  barOptions: any;
  pieOptions: any;
  lineOptions: any;

  // ✅ Agregar propiedades para manejo de carga
  loading = false;

  // ✅ Propiedad para rastrear si las categorías están vacías
  private emptyCategoriesData = false;

  // ✅ Inyectar ambos servicios
  constructor(
    private auctionHouseService: AuctionHouseService,
    private securityService: SecurityService
  ) {}

  ngOnInit() {
    this.initChartOptions();
    this.loadStatsFromCurrentUser();
  }

  // ✅ Modificar para cargar ambas estadísticas
  loadStatsFromCurrentUser() {
    const currentUser = this.securityService.actualUser;
    
    if (currentUser && currentUser.id) {
      console.log('📋 Usuario actual:', currentUser);
      console.log('🆔 ID del usuario:', currentUser.id);
      
      this.loadAllStatistics(currentUser.id.toString());
    } else {
      console.warn('⚠️ No hay usuario actual o no tiene ID');
      this.initChartData(); // Fallback a datos de prueba
    }
  }

  // ✅ Método para cargar todas las estadísticas
  loadAllStatistics(auctionHouseId: string) {
    this.loading = true;
    
    // Cargar estadísticas de ventas
    this.auctionHouseService.getSalesStatistics(auctionHouseId)
      .subscribe({
        next: (response) => {
          console.log('📊 Datos de estadísticas de ventas recibidos:', response);
          this.mapSalesDataToChart(response.data);
        },
        error: (error) => {
          console.error('❌ Error al cargar estadísticas de ventas:', error);
        }
      });

    // Cargar estadísticas de categorías
    this.auctionHouseService.getCategoryStatistics(auctionHouseId)
      .subscribe({
        next: (response) => {
          console.log('📈 Datos de estadísticas de categorías recibidos:', response);
          this.mapCategoryDataToChart(response.data);
        },
        error: (error) => {
          console.error('❌ Error al cargar estadísticas de categorías:', error);
        }
      });

    // ✅ Cargar estadísticas de pujas
    this.auctionHouseService.getBidStatistics(auctionHouseId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          console.log('📈 Datos de estadísticas de pujas recibidos:', response);
          this.mapBidDataToChart(response.data);
          this.initOtherChartsWithDummyData(); // Solo compradores por ahora
        },
        error: (error) => {
          console.error('❌ Error al cargar estadísticas de pujas:', error);
          this.initOtherChartsWithDummyData();
        }
      });
      
      // Agregar al final:
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 500);
  }

  // ✅ Mapear datos reales del servidor al gráfico de ventas
  mapSalesDataToChart(data: any) {
    this.salesData = {
      labels: data.months.map((month: any) => month.month),
      datasets: [
        {
          label: `Ventas ${data.year}`,
          backgroundColor: '#42A5F5',
          data: data.months.map((month: any) => month.count)
        }
      ]
    };
  }

  // ✅ Método helper para verificar si las categorías están vacías
  isEmptyCategories(): boolean {
    return this.emptyCategoriesData;
  }

  // ✅ Actualizar método mapCategoryDataToChart
  mapCategoryDataToChart(data: any) {
    if (data.categorias && data.categorias.length > 0) {
      this.emptyCategoriesData = false; // ✅ Hay datos
      
      this.categoryData = {
        labels: data.categorias.map((cat: any) => cat.categoria),
        datasets: [
          {
            data: data.categorias.map((cat: any) => cat.cantidad),
            backgroundColor: [
              '#FF6384',
              '#36A2EB', 
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
              '#FF6384',
              '#C9CBCF'
            ]
          }
        ]
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
            text: `Distribución por categorías de artículos vendidos `, // ✅ Título actualizado
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const categoria = data.categorias[context.dataIndex];
                return categoria.label;
              }
            }
          }
        }
      };
    } else {
      this.emptyCategoriesData = true; // ✅ No hay datos
      
      // ✅ Círculo vacío con mensaje
      this.categoryData = {
        labels: ['Sin datos'],
        datasets: [
          {
            data: [1],
            backgroundColor: ['#F5F5F5'],
            borderColor: ['#E0E0E0'],
            borderWidth: 2
          }
        ]
      };
      
      this.pieOptions = {
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Sin artículos vendidos por categoría', // ✅ Título actualizado
            font: {
              size: 16
            },
            color: '#666666'
          },
          tooltip: {
            enabled: false
          }
        }
      };
    }
  }

  // ✅ Actualizar método para mapear datos de pujas con numeración secuencial
  mapBidDataToChart(data: any) {
    console.log('🔍 DEBUG - Datos de pujas recibidos:', data);
    
    // ✅ Los datos vienen directamente como array
    if (data && Array.isArray(data) && data.length > 0) {
      this.bidsData = {
        labels: data.map((subasta: any, index: number) => `Subasta ${index + 1}`), // ✅ Usar índice + 1
        datasets: [
          {
            label: 'Número de pujas',
            data: data.map((subasta: any) => subasta.total_pujas),
            fill: false,
            borderColor: '#4BC0C0',
            backgroundColor: '#4BC0C0',
            tension: 0.4
          }
        ]
      };
      
      // ✅ Calcular total de pujas
      const totalPujas = data.reduce((sum: number, subasta: any) => sum + (subasta.total_pujas || 0), 0);
      
      console.log('🔍 DEBUG - Total pujas calculado:', totalPujas);
      console.log('🔍 DEBUG - Datos del gráfico:', this.bidsData);
      
      // ✅ Actualizar opciones del gráfico de líneas
      this.lineOptions = {
        plugins: {
          legend: {
            labels: {
              color: '#495057'
            }
          },
          title: {
            display: true,
            text: `Estadísticas de pujas por subasta (${totalPujas} pujas totales)`,
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const subasta = data[context.dataIndex];
                // ✅ Mostrar numeración secuencial en tooltip pero con ID real
                return `Subasta ${context.dataIndex + 1} (ID: ${subasta.subasta_id}): ${subasta.total_pujas} pujas`;
              }
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
              color: '#495057',
              stepSize: 1,
              precision: 0
            },
            grid: {
              color: '#ebedef'
            },
            beginAtZero: true
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true
        }
      };
    } else {
      console.log('⚠️ No hay datos de subastas disponibles');
      
      // ✅ Si no hay datos, mostrar gráfico vacío
      this.bidsData = {
        labels: ['Sin datos'],
        datasets: [
          {
            label: 'Número de pujas',
            data: [0],
            fill: false,
            borderColor: '#E0E0E0',
            backgroundColor: '#F5F5F5',
            tension: 0.4
          }
        ]
      };
      
      this.lineOptions = {
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Sin datos de pujas disponibles',
            font: {
              size: 16
            },
            color: '#666666'
          },
          tooltip: {
            enabled: false
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
              color: '#495057',
              stepSize: 1,
              precision: 0
            },
            grid: {
              color: '#ebedef'
            },
            beginAtZero: true
          }
        }
      };
    }
  }

  // ✅ Solo mantener compradores con datos de prueba
  initOtherChartsWithDummyData() {
    // ✅ ELIMINADO: Datos de compradores frecuentes
  }

  // ✅ Datos de prueba como fallback
  initChartData() {
    // Datos de ventas mensuales (fallback)
    this.salesData = {
      labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      datasets: [
        {
          label: 'Ventas 2025',
          backgroundColor: '#42A5F5',
          data: [65, 59, 80, 81, 56, 55, 0, 0, 0, 0, 0, 0]
        }
      ]
    };

    // Datos de categorías de prueba
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

    // Datos de pujas de prueba
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
  }

  initChartOptions() {
    // Opciones comunes
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
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
            color: '#495057',
            stepSize: 1, // ✅ Agregar esto para valores discretos
            precision: 0 // ✅ Sin decimales
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
      indexAxis: 'x', // Esto asegura que las barras sean verticales (más altura)
      aspectRatio: 1.5, // Controla la proporción entre ancho y alto
      plugins: {
        ...commonOptions.plugins,
        title: {
          display: true,
          text: 'Número de subastas concretadas por mes',
          font: {
            size: 16
          }
        }
      },
      scales: {
        ...commonOptions.scales,
        y: {
          ...commonOptions.scales.y,
          beginAtZero: true, // ✅ Empezar desde 0
          ticks: {
            ...commonOptions.scales.y.ticks,
            stepSize: 1, // ✅ Solo números enteros
            precision: 0, // ✅ Sin decimales
            callback: function(value: any) {
              // ✅ Asegurar que solo se muestren números enteros
              if (Number.isInteger(value)) {
                return value;
              }
            }
          }
        }
      }
    };

    this.pieOptions = {
      maintainAspectRatio: false, // ✅ AÑADIR ESTA LÍNEA TAMBIÉN PARA PIE (o moverla a commonOptions si aplica a todos)
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#495057'
          }
        },
        title: {
          display: true,
          text: 'Distribución por categorías de artículos vendidos', // ✅ Cambiar título
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
  }
}
