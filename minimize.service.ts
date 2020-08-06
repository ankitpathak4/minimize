import { LocationStrategy } from '@angular/common';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs';

@Injectable()

export class MinimizeService {
  totalTabs = []
  idCounter: number = 0;
  public tab$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  subscription: Subscription
  private _isMobile = false;

  constructor(private breakpointObserver: BreakpointObserver, private location: LocationStrategy) {
    this.subscription = this.tab$.subscribe(res => {
      if (res != null) {
        res.forEach(tab => {
          if (tab.isMinimized) {
            this.setTabOrder(tab.modalId);
          }
        })
      }
    })
    this.breakpointObserver.observe([Breakpoints.WebPortrait, Breakpoints.WebLandscape, Breakpoints.HandsetPortrait, Breakpoints.HandsetLandscape, Breakpoints.TabletPortrait, Breakpoints.TabletLandscape]).subscribe((state: BreakpointState) => {
      if (state.matches) {
        if (state.breakpoints[Breakpoints.WebPortrait] == true)
          this._isMobile = false
        else if (state.breakpoints[Breakpoints.WebLandscape] == true)
          this._isMobile = false
        else if (state.breakpoints[Breakpoints.HandsetPortrait] == true)
          this._isMobile = true
        else if (state.breakpoints[Breakpoints.HandsetLandscape] == true)
          this._isMobile = true
        else if (state.breakpoints[Breakpoints.TabletPortrait] == true)
          this._isMobile = true
        else if (state.breakpoints[Breakpoints.TabletLandscape] == true)
          this._isMobile = true
      }
    })
  }

  get isMobile() {
    return this._isMobile;
  }

  getModalTabInstance(previousSelectedRowIndex, actionType, pageCode, requesterPageCode, modalId) {

    let modalRefArr: HTMLCollectionOf<Element> = document.getElementsByClassName(modalId);
    let modalContent = modalRefArr[1].getElementsByClassName('modal-content');
    let modalClass = {};
    modalClass['backdrop'] = new String(modalRefArr[0].className);
    modalClass['window'] = new String(modalRefArr[1].className);

    this.idCounter++;
    let newTab = {
      id: this.idCounter,
      index: this.totalTabs.length,
      previousSelectedRowIndex: previousSelectedRowIndex,
      actionType: actionType,
      pageCode: pageCode,
      requesterPageCode: requesterPageCode,
      isMinimized: false,
      modalId: modalId,
      modalElements: {
        modalRefArr: modalRefArr,
        modalClass: modalClass,
        modalContent: modalContent
      }
    }
    this.totalTabs.push(newTab);
    return newTab;
  }

  isMaxLimit() {
    if (this.totalTabs.length >= 20) {
      return true;
    }
    else {
      return false;
    }
  }

  isRowModalOpen(rowIndex, pageCode, requesterPageCode) {
    let duplicateTabArr = this.totalTabs.filter(tab => {
      return tab.pageCode == pageCode && tab.previousSelectedRowIndex == rowIndex
    })
    if (duplicateTabArr.length > 0) {
      return true
    }
    else {
      return false
    }
  }

  removeModalInstance(modalId) {
    this.totalTabs.forEach(tab => {
      if (tab.modalId == modalId) {
        this.totalTabs.splice(tab.index, 1);
      }
    })
    this.totalTabs.forEach((tab, ind) => {
      tab.index = ind;
    })
    this.tab$.next(this.totalTabs);
  }

  getUpdatedTabIndex(tabId) {
    let newIndex: number
    this.totalTabs.forEach(tab => {
      if (tab.id == tabId) {
        newIndex = tab.index;
      }
    })
    return newIndex
  }

  isSecondEditWindow(pageCode, actionType, requesterPageCode) {
    let secondEditTabArr = this.totalTabs.filter(tab => {
      return tab.pageCode == pageCode && tab.actionType != 'VIEW'
        && tab.actionType == actionType
    })
    if (secondEditTabArr.length > 0) {
      return true;
    }
    else {
      return false;
    }
  }

  editAddValidator() {

  }

  generateMinimizeService(index, actionType, pageCode, requesterPageCode?) {
    if (this.isRowModalOpen(index, pageCode, requesterPageCode)) {
      let msg = ''
      if (index == -1) {
        msg = 'This Page is already open.'
      }
      else {
        msg = 'One request already opned for selected row.'
      }
      return { result: false, msg: msg }
    }
    if (actionType != "VIEW" && this.isSecondEditWindow(pageCode, actionType, requesterPageCode)) {
      return { result: false, msg: `${actionType} mode is already opened for another request.` }
    }
    if (this.isMaxLimit()) {
      return { result: false, msg: 'Can not open more than 20 modals at a time.' }
    }
    return { result: true, msg: '' }
  }

  minimize(modalId, options?) {
    this.totalTabs.forEach(tab => {
      if (tab.modalId == modalId) {
        tab.isMinimized = true;
        tab.modalElements.modalRefArr[0].className = modalId;

        if (options && (options as Object).hasOwnProperty('isVisible') && !options.isVisible) {
          (tab.modalElements.modalRefArr[1] as HTMLElement).style.display = 'none';
          (tab.modalElements.modalRefArr[1] as HTMLElement).style.visibility = 'hidden';
          (tab.modalElements.modalContent[0] as HTMLElement).style.display = 'none';
          (tab.modalElements.modalContent[0] as HTMLElement).style.visibility = 'hidden';
        }

        (tab.modalElements.modalRefArr[1] as HTMLElement).style.width = '250px';
        (tab.modalElements.modalRefArr[1] as HTMLElement).style.height = '30px';
        (tab.modalElements.modalRefArr[1] as HTMLElement).style.position = 'absolute';
        // (tab.modalElements.modalRefArr[1] as HTMLElement).style['z-index'] = '999999';

        (tab.modalElements.modalContent[0] as HTMLElement).style.width = '250px';
        (tab.modalElements.modalContent[0] as HTMLElement).style.height = '25px';
        (tab.modalElements.modalContent[0] as HTMLElement).style.position = 'absolute';
        (tab.modalElements.modalContent[0] as HTMLElement).style.borderRadius = '10px';
        // (tab.modalElements.modalContent[0] as HTMLElement).style['z-index']  = '999999';
        this.setTabOrder(modalId)
      }
    })
  }

  maximize(modalId) {
    this.totalTabs.forEach(tab => {
      if (tab.modalId == modalId) {
        tab.isMinimized = false;
        tab.modalElements.modalRefArr[0].className = tab.modalElements.modalClass['backdrop'];
        tab.modalElements.modalRefArr[1].className = tab.modalElements.modalClass['window'];

        (tab.modalElements.modalRefArr[1] as HTMLElement).style.width = '';
        (tab.modalElements.modalRefArr[1] as HTMLElement).style.height = '';
        (tab.modalElements.modalRefArr[1] as HTMLElement).style.bottom = '';
        (tab.modalElements.modalRefArr[1] as HTMLElement).style.left = '';
        (tab.modalElements.modalRefArr[1] as HTMLElement).style.position = '';

        (tab.modalElements.modalContent[0] as HTMLElement).style.width = '';
        (tab.modalElements.modalContent[0] as HTMLElement).style.height = '';
        (tab.modalElements.modalContent[0] as HTMLElement).style.bottom = '';
        (tab.modalElements.modalContent[0] as HTMLElement).style.left = '';
        (tab.modalElements.modalContent[0] as HTMLElement).style.position = '';
        (tab.modalElements.modalContent[0] as HTMLElement).style.borderRadius = '';
      }
    })
  }

  setTabOrder(modalId) {
    this.totalTabs.forEach(tab => {
      if (tab.modalId == modalId) {
        let hPositionMultiplier = 0;
        let vPositionMultiplier = 0;
        if (tab.index < 5) {
          hPositionMultiplier = tab.index;
        }
        else if (tab.index < 10) {
          hPositionMultiplier = tab.index - 5;
          vPositionMultiplier = 1
        }
        else if (tab.index < 15) {
          hPositionMultiplier = tab.index - 10;
          vPositionMultiplier = 2
        }
        else if (tab.index < 20) {
          hPositionMultiplier = tab.index - 15;
          vPositionMultiplier = 3
        }

        const translateX = hPositionMultiplier * 250;
        const translateY = vPositionMultiplier * 30;
        (tab.modalElements.modalRefArr[1] as HTMLElement).style.bottom = translateY + 'px';
        (tab.modalElements.modalRefArr[1] as HTMLElement).style.left = translateX + 5 + 'px';
        (tab.modalElements.modalContent[0] as HTMLElement).style.bottom = translateY + 'px';
        (tab.modalElements.modalContent[0] as HTMLElement).style.left = translateX + 5 + 'px';
      }
    })
  }

  getMinimizeButtonVisibility(page) {
    if (this.isMobile) {
      return false;
    } else if (page.isFromRouting) {
      return false;
    } else if (page.PageOptions && !page.PageOptions.IsMinimizeRequired) {
      return false;
    } else if (page.isMinimizing) {
      return false;
    } else {
      return true;
    }
  }

  getRecentModalId() {
    let lastIndex = this.totalTabs.length - 1;
    let recentModalId = ''
    if (lastIndex >= 0) {
      recentModalId = this.totalTabs[lastIndex].modalId
    }
    return recentModalId
  }

  closePageOnBrowserBack(page) {
    this.location.onPopState((event) => {
      let recentModalId = this.getRecentModalId();
      if (page
        && page.modalId == recentModalId
        && !page.isFromRouting
        && page.fnOnActiveModalClose) {
        page.fnOnActiveModalClose(false)
      }
      if (page
        && page.modalId == recentModalId
        && page.isFromRouting) {
        window['cboVariables']['isAngularFirstPage'] = true;
        let inputElement = document.getElementById('isAngularFirstPage');
        if (inputElement) {
          (inputElement as HTMLInputElement).value = 'true';
        }
      }
    })
  }

}
