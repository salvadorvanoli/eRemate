import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
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
    ProgressSpinnerModule
  ],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss'
})
export class StatsComponent implements OnInit {
  salesData: any;
  categoryData: any;
  bidsData: any;
  barOptions: any;
  pieOptions: any;
  lineOptions: any;
  loading = false;
  private emptyCategoriesData = false;
  private emptyBidsData = false;

  constructor(
    private auctionHouseService: AuctionHouseService,
    private securityService: SecurityService
  ) {}

  ngOnInit() {
    this.initChartOptions();
    this.loadStatsFromCurrentUser();
  }

  loadStatsFromCurrentUser() {
    const currentUser = this.securityService.actualUser;
    
    if (currentUser && currentUser.id) {
      this.loadAllStatistics(currentUser.id.toString());
    } else {
      this.initChartData();
    }
  }

  loadAllStatistics(auctionHouseId: string) {
    this.loading = true;
    
    this.auctionHouseService.getSalesStatistics(auctionHouseId)
      .subscribe({
        next: (response) => {
          this.mapSalesDataToChart(response.data);
        },
        error: (error) => {
          this.initDummySalesData();
        }
      });

    this.auctionHouseService.getCategoryStatistics(auctionHouseId)
      .subscribe({
        next: (response) => {
          this.mapCategoryDataToChart(response.data);
        },
        error: (error) => {
          this.initDummyCategoryData();
        }
      });

    this.auctionHouseService.getBidStatistics(auctionHouseId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.mapBidDataToChart(response.data);
        },
        error: (error) => {
          this.emptyBidsData = true;
          this.bidsData = null;
        }
      });
      
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 500);
  }

  mapSalesDataToChart(data: any) {
    this.salesData = {
      labels: data.months.map((month: any) => month.month),
      datasets: [
        {
          label: `Subastas ${data.year}`,
          backgroundColor: 'rgba(99, 52, 227, 0.8)',
          borderColor: '#6334E3',
          borderWidth: 2,
          borderRadius: 6,
          data: data.months.map((month: any) => month.count)
        }
      ]
    };
  }

  isEmptyCategories(): boolean {
    return this.emptyCategoriesData;
  }

  isEmptyBids(): boolean {
    return this.emptyBidsData;
  }

  mapCategoryDataToChart(data: any) {
    if (data.categorias && data.categorias.length > 0) {
      this.emptyCategoriesData = false;
      
      this.categoryData = {
        labels: data.categorias.map((cat: any) => cat.categoria),
        datasets: [
          {
            data: data.categorias.map((cat: any) => cat.cantidad),
            backgroundColor: [
              '#6334E3',
              '#9C27B0', 
              '#E91E63',
              '#FF5722',
              '#FF9800',
              '#FFC107',
              '#4CAF50',
              '#2196F3'
            ],
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverBorderWidth: 3
          }
        ]
      };
    } else {
      this.emptyCategoriesData = true;
      this.categoryData = {
        labels: ['Sin datos'],
        datasets: [
          {
            data: [1],
            backgroundColor: ['#f8f9fa'],
            borderColor: ['#dee2e6'],
            borderWidth: 2
          }
        ]
      };
    }
  }

  mapBidDataToChart(data: any) {
    if (data && Array.isArray(data) && data.length > 0) {
      this.emptyBidsData = false;
      this.bidsData = {
        labels: data.map((subasta: any, index: number) => `Subasta ${index + 1}`),
        datasets: [
          {
            label: 'Número de pujas',
            data: data.map((subasta: any) => subasta.total_pujas),
            fill: true,
            backgroundColor: 'rgba(99, 52, 227, 0.1)',
            borderColor: '#6334E3',
            borderWidth: 3,
            pointBackgroundColor: '#6334E3',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            tension: 0.4
          }
        ]
      };
    } else {
      this.emptyBidsData = true;
      this.bidsData = null;
    }
  }

  initDummySalesData() {
    this.salesData = {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Subastas 2025',
          backgroundColor: 'rgba(99, 52, 227, 0.8)',
          borderColor: '#6334E3',
          borderWidth: 2,
          borderRadius: 6,
          data: [12, 8, 15, 10, 20, 18]
        }
      ]
    };
  }

  initDummyCategoryData() {
    this.emptyCategoriesData = false;
    this.categoryData = {
      labels: ['Antigüedades', 'Arte', 'Vehículos', 'Inmuebles', 'Joyas'],
      datasets: [
        {
          data: [30, 25, 20, 15, 10],
          backgroundColor: [
            '#6334E3',
            '#9C27B0',
            '#E91E63',
            '#FF5722',
            '#FF9800'
          ],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverBorderWidth: 3
        }
      ]
    };
  }

  initChartData() {
    this.initDummySalesData();
    this.initDummyCategoryData();
    this.emptyBidsData = true;
    this.bidsData = null;
  }

  initChartOptions() {
    const commonGridColor = 'rgba(99, 52, 227, 0.1)';
    const commonTextColor = '#495057';

    this.barOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#6334E3',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false
        }
      },
      scales: {
        x: {
          ticks: {
            color: commonTextColor,
            font: {
              size: 12,
              weight: '500'
            }
          },
          grid: {
            color: commonGridColor,
            drawBorder: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: commonTextColor,
            stepSize: 1,
            precision: 0,
            font: {
              size: 12,
              weight: '500'
            }
          },
          grid: {
            color: commonGridColor,
            drawBorder: false
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    };

    this.pieOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: commonTextColor,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 15,
            font: {
              size: 12,
              weight: '500'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#6334E3',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function(context: any) {
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1000
      }
    };

    this.lineOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#6334E3',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false
        }
      },
      scales: {
        x: {
          ticks: {
            color: commonTextColor,
            font: {
              size: 12,
              weight: '500'
            }
          },
          grid: {
            color: commonGridColor,
            drawBorder: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: commonTextColor,
            stepSize: 1,
            precision: 0,
            font: {
              size: 12,
              weight: '500'
            }
          },
          grid: {
            color: commonGridColor,
            drawBorder: false
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    };
  }
}
