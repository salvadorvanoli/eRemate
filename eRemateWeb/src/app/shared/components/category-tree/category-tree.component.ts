import { Component, Output, EventEmitter } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { Tree } from 'primeng/tree';
import { CategoryService } from '../../../core/services/category.service';
import { CategoriaNodo } from '../../../core/models/categoria';

@Component({
  selector: 'app-category-tree',
  standalone: true,
  imports: [
    Tree
  ],
  templateUrl: './category-tree.component.html',
  styleUrl: './category-tree.component.scss'
})
export class CategoryTreeComponent {

  categories!: TreeNode[];
  selectedCategories: TreeNode[] = [];
  private lastEmittedIds: number[] = [];
  
  @Output() selection = new EventEmitter<number[]>();

  constructor(
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.categories = [];
    this.categoryService.getAllCategoriesTree().subscribe((data) => {
      data.forEach((category) => {
        const node: TreeNode = this.createTreeNode(category);
        this.categories.push(node);
      });
    });
  }

  changedSelectedCategories() {
    const newSelectedIds = this.getProductIdsFromCategories(this.selectedCategories);
  
    if (!this.areArraysEqual(this.lastEmittedIds, newSelectedIds)) {
      this.lastEmittedIds = [...newSelectedIds];
      this.selection.emit(newSelectedIds);
    }
  }

  private getProductIdsFromCategories(nodes: TreeNode[]): number[] {
    return nodes
      .filter(node => node?.data?.productos)
      .flatMap(node => Array.isArray(node.data.productos) ? node.data.productos : []);
  }
  
  private areArraysEqual(arr1: number[], arr2: number[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, idx) => val === arr2[idx]);
  }

  private createTreeNode(category: CategoriaNodo): TreeNode {
    return {
      key: category.id.toString(),
      data: category,
      label: category.nombre,
      children: category.hijos.map((child) => ({
        data: child,
        label: child.nombre,
        children: []
      }))
    };
  }
}
