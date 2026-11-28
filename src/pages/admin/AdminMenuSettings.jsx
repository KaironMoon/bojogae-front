import MenuSettingsEditor from "./MenuSettingsEditor";
import {
  DEFAULT_ADMIN_MENU_ITEMS,
  dissolveAdminCustomGroup,
  hasAdminMenuChanges,
  isAdminMenuEligible,
  mergeAdminMenusIntoGroup,
  moveAdminMenuNodeWithMeta,
  promoteAdminChildToTop,
} from "@/services/admin-menu-config";
import { getAdminMenu, updateAdminMenu } from "@/services/admin-menu-service";

const isAdminChildVisible = (child) => Boolean(child?.visible);

export default function AdminMenuSettings() {
  return (
    <MenuSettingsEditor
      mode="admin"
      title="좌측 관리자 메뉴 구성"
      description="관리자 메뉴 순서를 변경하거나 두 메뉴를 하나로 합쳐 새 상위 그룹을 만들 수 있습니다."
      schemaMissingText="관리자 메뉴 설정 DB 테이블(110_admin_menu_settings.sql) 적용 후 저장할 수 있습니다."
      defaultItems={DEFAULT_ADMIN_MENU_ITEMS}
      defaultExpandedGroups={{ admin_points_group: true, admin_boards_group: true }}
      loadSettings={getAdminMenu}
      saveSettings={updateAdminMenu}
      hasChanges={hasAdminMenuChanges}
      moveNodeWithMeta={moveAdminMenuNodeWithMeta}
      mergeIntoGroup={mergeAdminMenusIntoGroup}
      dissolveGroup={dissolveAdminCustomGroup}
      promoteChild={promoteAdminChildToTop}
      isChildEligible={isAdminChildVisible}
      isMenuEligible={isAdminMenuEligible}
    />
  );
}
