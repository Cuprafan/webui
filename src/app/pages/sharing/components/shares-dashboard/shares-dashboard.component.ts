import { Component, ElementRef, ViewChild } from '@angular/core';
import { T } from 'app/translate-marker';
import { helptext_sharing_webdav } from 'app/helptext/sharing';
import { InputExpandableTableConf } from 'app/pages/common/entity/table/expandable-table/expandable-table.component';
import { helptext_sharing_smb } from 'app/helptext/sharing';
import { helptext_sharing_nfs } from 'app/helptext/sharing';
import { NFSFormComponent } from 'app/pages/sharing/nfs/nfs-form';
import {
  AppLoaderService, DialogService, IscsiService, ModalService, NetworkService, SystemGeneralService, UserService, WebSocketService,
} from 'app/services';
import { SMBFormComponent } from 'app/pages/sharing/smb/smb-form';
import { ActivatedRoute, Router } from '@angular/router';
import { WebdavFormComponent } from 'app/pages/sharing/webdav/webdav-form';
import { TranslateService } from '@ngx-translate/core';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form';
import { EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { Validators } from '@angular/forms';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { TableComponent } from 'app/pages/common/entity/table/table.component';

enum ShareType {
  SMB = 'smb',
  NFS = 'nfs',
  ISCSI = 'iscsi',
  WebDAV = 'webdav',
}

@Component({
  selector: 'app-shares-dashboard',
  templateUrl: './shares-dashboard.template.html',
  styleUrls: ['./shares-dashboard.component.scss'],
  providers: [IscsiService],
})
export class SharesDashboardComponent {
  webdavTableConf: InputExpandableTableConf = this.getTableConfigForShareType(ShareType.WebDAV);
  nfsTableConf: InputExpandableTableConf = this.getTableConfigForShareType(ShareType.NFS);
  smbTableConf: InputExpandableTableConf = this.getTableConfigForShareType(ShareType.SMB);
  iscsiTableConf: InputExpandableTableConf = this.getTableConfigForShareType(ShareType.ISCSI);

  emptyTableConf: EmptyConfig = {
    type: EmptyType.no_page_data,
    large: true,
    title: 'No Shares Configured',
    message: 'You have not configured any shares yet. Click the \'Add Share\' button to add your first share.',
    button: {
      label: 'Add Share',
      action: this.showAddDialog.bind(this),
    },
  };

  webdavHasItems = 0;
  nfsHasItems = 0;
  smbHasItems = 0;
  iscsiHasItems = 0;
  noOfPopulatedTables = 0;

  constructor(private userService: UserService, private modalService: ModalService, private ws: WebSocketService,
    private dialog: DialogService, private networkService: NetworkService, private router: Router,
    private loader: AppLoaderService, private sysGeneralService: SystemGeneralService, private aroute: ActivatedRoute,
    private iscsiService: IscsiService, private translate: TranslateService) {}

  ngAfterViewInit(): void {
    if (this.webdavHasItems) {
      this.webdavTableConf.alwaysExpanded = true;
    }
    if (this.nfsHasItems) {
      this.nfsTableConf.alwaysExpanded = true;
    }
    if (this.smbHasItems) {
      this.smbTableConf.alwaysExpanded = true;
    }
    if (this.iscsiHasItems) {
      this.iscsiTableConf.alwaysExpanded = true;
    }
  }

  refreshDashboard(shareType: ShareType = null): void {
    switch (shareType) {
      case ShareType.ISCSI: {
        this.iscsiTableConf = this.getTableConfigForShareType(ShareType.ISCSI);
        break;
      }
      case ShareType.NFS: {
        this.nfsTableConf = this.getTableConfigForShareType(ShareType.NFS);
        break;
      }
      case ShareType.SMB: {
        this.smbTableConf = this.getTableConfigForShareType(ShareType.SMB);
        break;
      }
      case ShareType.WebDAV: {
        this.webdavTableConf = this.getTableConfigForShareType(ShareType.WebDAV);
        break;
      }
      default: {
        this.webdavTableConf = this.getTableConfigForShareType(ShareType.WebDAV);
        this.nfsTableConf = this.getTableConfigForShareType(ShareType.NFS);
        this.smbTableConf = this.getTableConfigForShareType(ShareType.SMB);
        this.iscsiTableConf = this.getTableConfigForShareType(ShareType.ISCSI);
        break;
      }
    }
  }

  getTableConfigForShareType(shareType: ShareType): InputExpandableTableConf {
    switch (shareType) {
      case ShareType.NFS: {
        return {
          title: T('UNIX (NFS) Shares'),
          titleHref: '/sharing/nfs',
          queryCall: 'sharing.nfs.query',
          deleteCall: 'sharing.nfs.delete',
          deleteMsg: {
            title: T('Delete'),
            key_props: ['name'],
          },
          limitRowsByMaxHeight: true,
          emptyEntityLarge: false,
          parent: this,
          columns: [
            { name: helptext_sharing_nfs.column_path, prop: 'paths', always_display: true },
            { name: helptext_sharing_nfs.column_comment, prop: 'comment' },
            { name: helptext_sharing_nfs.column_enabled, prop: 'enabled' },
          ],
          detailsHref: '/sharing/nfs',
          add() {
            this.parent.add(this.tableComponent, ShareType.NFS);
          },
          edit(row: any) {
            this.parent.edit(this.tableComponent, ShareType.NFS, row.id);
          },
          afterGetData: (data: any) => {
            this.nfsHasItems = 0;
            this.nfsTableConf.alwaysExpanded = false;
            if (this.nfsTableConf?.expandableTableComponent) {
              this.nfsTableConf.expandableTableComponent.updateAlwaysExpanded(false);
            }
            if (data.length > 0) {
              this.nfsHasItems = 1;
              this.nfsTableConf.alwaysExpanded = true;
              if (this.nfsTableConf?.expandableTableComponent) {
                this.nfsTableConf.expandableTableComponent.updateAlwaysExpanded(true);
              }
              this.updateNumberOfTables();
            }
          },
          expandedIfNotEmpty: true,
          collapsedIfEmpty: true,
          limitRows: 5,
        };
      }
      case ShareType.ISCSI: {
        return {
          title: T('Block (ISCSI) Shares Targets'),
          titleHref: '/sharing/iscsi/target',
          queryCall: 'iscsi.target.query',
          deleteCall: 'iscsi.target.delete',
          detailsHref: '/sharing/iscsi/target',
          deleteMsg: {
            title: T('Delete'),
            key_props: ['name'],
          },
          limitRowsByMaxHeight: true,
          emptyEntityLarge: false,
          parent: this,
          columns: [
            {
              name: T('Target Name'),
              prop: 'name',
              always_display: true,
            },
            {
              name: T('Target Alias'),
              prop: 'alias',
            },
          ],
          add() {
            this.parent.add(this.tableComponent, ShareType.ISCSI);
          },
          edit(row: any) {
            this.parent.edit(this.tableComponent, ShareType.ISCSI, row.id);
          },
          collapsedIfEmpty: true,
          afterGetData: (data: any) => {
            this.iscsiHasItems = 0;
            this.iscsiTableConf.alwaysExpanded = false;
            if (this.iscsiTableConf?.expandableTableComponent) {
              this.iscsiTableConf.expandableTableComponent.updateAlwaysExpanded(false);
            }
            if (data.length > 0) {
              this.iscsiHasItems = 1;
              this.iscsiTableConf.alwaysExpanded = true;
              if (this.iscsiTableConf?.expandableTableComponent) {
                this.iscsiTableConf.expandableTableComponent.updateAlwaysExpanded(true);
              }
              this.updateNumberOfTables();
            }
          },
          expandedIfNotEmpty: true,
          limitRows: 5,
        };
      }
      case ShareType.WebDAV: {
        return {
          title: T('WebDAV'),
          titleHref: '/sharing/webdav',
          queryCall: 'sharing.webdav.query',
          deleteCall: 'sharing.webdav.delete',
          deleteMsg: {
            title: T('Delete'),
            key_props: ['name'],
          },
          emptyEntityLarge: false,
          parent: this,
          columns: [
            { prop: 'name', name: helptext_sharing_webdav.column_name, always_display: true },
            { prop: 'comment', name: helptext_sharing_webdav.column_comment },
            { prop: 'path', name: helptext_sharing_webdav.column_path },
            { prop: 'enabled', name: helptext_sharing_webdav.column_enabled },
            { prop: 'ro', name: helptext_sharing_webdav.column_ro, hidden: true },
            { prop: 'perm', name: helptext_sharing_webdav.column_perm, hidden: true },
          ],
          add() {
            this.parent.add(this.tableComponent, ShareType.WebDAV);
          },
          limitRowsByMaxHeight: true,
          edit(row: any) {
            this.parent.edit(this.tableComponent, ShareType.WebDAV, row.id);
          },
          afterGetData: (data: any) => {
            this.webdavHasItems = 0;
            if (this.webdavTableConf?.expandableTableComponent) {
              this.webdavTableConf.expandableTableComponent.updateAlwaysExpanded(false);
            }
            this.webdavTableConf.alwaysExpanded = false;
            if (data.length > 0) {
              this.webdavHasItems = 1;
              if (this.webdavTableConf?.expandableTableComponent) {
                this.webdavTableConf.expandableTableComponent.updateAlwaysExpanded(true);
              }
              this.webdavTableConf.alwaysExpanded = true;
              this.updateNumberOfTables();
            }
          },
          expandedIfNotEmpty: true,
          collapsedIfEmpty: true,
          detailsHref: '/sharing/webdav',
          limitRows: 5,
        };
      }
      case ShareType.SMB: {
        return {
          title: T('Windows (SMB) Shares'),
          titleHref: '/sharing/smb',
          queryCall: 'sharing.smb.query',
          deleteCall: 'sharing.smb.delete',
          deleteMsg: {
            title: T('Delete'),
            key_props: ['name'],
          },
          detailsHref: '/sharing/smb',
          emptyEntityLarge: false,
          parent: this,
          columns: [
            { name: helptext_sharing_smb.column_name, prop: 'name', always_display: true },
            { name: helptext_sharing_smb.column_path, prop: 'path' },
            { name: helptext_sharing_smb.column_comment, prop: 'comment' },
            { name: helptext_sharing_smb.column_enabled, prop: 'enabled', checkbox: true },
          ],
          limitRowsByMaxHeight: true,
          add() {
            this.parent.add(this.tableComponent, ShareType.SMB);
          },
          edit(row: any) {
            this.parent.edit(this.tableComponent, ShareType.SMB, row.id);
          },
          afterGetData: (data: any) => {
            this.smbHasItems = 0;
            this.smbTableConf.alwaysExpanded = false;
            if (this.smbTableConf?.expandableTableComponent) {
              this.smbTableConf.expandableTableComponent.updateAlwaysExpanded(false);
            }
            if (data.length > 0) {
              this.smbHasItems = 1;
              this.smbTableConf.alwaysExpanded = true;
              if (this.smbTableConf?.expandableTableComponent) {
                this.smbTableConf.expandableTableComponent.updateAlwaysExpanded(true);
              }
              this.updateNumberOfTables();
            }
          },
          expandedIfNotEmpty: true,
          collapsedIfEmpty: true,
          limitRows: 5,
        };
      }
    }
  }

  updateNumberOfTables(): void {
    this.noOfPopulatedTables = this.nfsHasItems + this.smbHasItems + this.iscsiHasItems + this.webdavHasItems;
  }

  add(tableComponent: TableComponent, share: ShareType, id?: number): void {
    let formComponent: NFSFormComponent | SMBFormComponent | WebdavFormComponent | TargetFormComponent;
    switch (share) {
      case ShareType.NFS:
        formComponent = new NFSFormComponent(this.userService, this.modalService, this.ws, this.dialog, this.networkService);
        break;
      case ShareType.SMB:
        formComponent = new SMBFormComponent(this.router, this.ws, this.dialog, this.loader, this.sysGeneralService, this.modalService);
        break;
      case ShareType.WebDAV:
        formComponent = new WebdavFormComponent(this.router, this.ws, this.dialog);
        break;
      case ShareType.ISCSI:
        formComponent = new TargetFormComponent(this.router, this.aroute, this.iscsiService, this.loader, this.translate, this.ws, this.modalService);
        break;
    }
    this.modalService.open('slide-in-form', formComponent, id);
    this.modalService.onClose$.subscribe((res) => {
      if (!tableComponent) {
        this.refreshDashboard();
      } else {
        tableComponent.getData();
      }
    }, (err) => {
      console.log('Error', err);
    });
  }

  edit(tableComponent: TableComponent, share: ShareType, id: number): void {
    this.add(tableComponent, share, id);
  }

  getTablesOrder(): string[] {
    const order: string[] = [ShareType.SMB, ShareType.NFS, ShareType.ISCSI, ShareType.WebDAV];
    // Note: The order of these IFs is important. One can't come before the other
    if (!this.smbHasItems) {
      order.splice(order.findIndex((share) => share === ShareType.SMB), 1);
      order.push(ShareType.SMB);
    }
    if (!this.nfsHasItems) {
      order.splice(order.findIndex((share) => share === ShareType.NFS), 1);
      order.push(ShareType.NFS);
    }
    if (!this.iscsiHasItems) {
      order.splice(order.findIndex((share) => share === ShareType.ISCSI), 1);
      order.push(ShareType.ISCSI);
    }
    if (!this.webdavHasItems) {
      order.splice(order.findIndex((share) => share === ShareType.WebDAV), 1);
      order.push(ShareType.WebDAV);
    }
    return order;
  }

  getContainerClass(): string {
    this.noOfPopulatedTables = this.webdavHasItems + this.nfsHasItems + this.smbHasItems + this.iscsiHasItems;
    switch (this.noOfPopulatedTables) {
      case 0:
        return 'zero-table-container';
      case 1:
        return 'one-table-container';
      case 2:
        return 'two-table-container';
      case 3:
        return 'three-table-container';
      case 4:
        return 'four-table-container';
      default:
        return 'four-table-container';
    }
  }

  getWebdavOrder(): string {
    const order = this.getTablesOrder();
    return this.getOrderFromIndex(order.findIndex((share) => share === ShareType.WebDAV));
  }

  getNfsOrder(): string {
    const order = this.getTablesOrder();
    return this.getOrderFromIndex(order.findIndex((share) => share === ShareType.NFS));
  }

  getIscsiOrder(): string {
    const order = this.getTablesOrder();
    return this.getOrderFromIndex(order.findIndex((share) => share === ShareType.ISCSI));
  }

  getSmbOrder(): string {
    const order = this.getTablesOrder();
    return this.getOrderFromIndex(order.findIndex((share) => share === ShareType.SMB));
  }

  getOrderFromIndex(index: number): string {
    switch (index) {
      case 0:
        return 'first';
      case 1:
        return 'second';
      case 2:
        return 'third';
      case 3:
        return 'fourth';
    }
  }

  showAddDialog(): void {
    const conf: DialogFormConfiguration = {
      title: 'Add New Share',
      message: 'Select the type of Share you want to add',
      saveButtonText: 'Create',
      fieldConfig: [{
        type: 'radio',
        name: 'share_type',
        options: [
          { label: 'SMB', value: ShareType.SMB },
          { label: 'NFS', value: ShareType.NFS },
          { label: 'ISCSI Target', value: ShareType.ISCSI },
          { label: 'WebDAV', value: ShareType.WebDAV },
        ],
        validation: [Validators.required],
      },
      ],
      customSubmit: (dialog: EntityDialogComponent) => {
        dialog.dialogRef.close();
        dialog.parent.add(null, dialog.formValue.share_type);
      },
      parent: this,
    };
    this.dialog.dialogForm(conf);
  }
}
