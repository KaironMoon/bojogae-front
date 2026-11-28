import MenuSettingsEditor from "./MenuSettingsEditor";
import {
  DEFAULT_USER_MENU_ITEMS,
  dissolveUserCustomGroup,
  hasMenuChanges,
  isChildEligibleForUser,
  isMenuEligibleForUser,
  mergeUserMenusIntoGroup,
  moveUserMenuNodeWithMeta,
  promoteChildToTop,
} from "@/services/user-menu-config";
import { getAdminUserMenu, updateAdminUserMenu } from "@/services/user-menu-service";

export default function UserMenuSettings() {
  return (
    <MenuSettingsEditor
      mode="user"
      title="좌측 유저 메뉴 구성"
      description="카드를 드래그해 1차 순서를 바꾸거나 다른 메뉴·그룹 위로 끌어 하위 메뉴로 묶을 수 있습니다."
      schemaMissingText="메뉴 설정 DB 테이블(104_user_menu_settings.sql) 적용 후 저장할 수 있습니다."
      defaultItems={DEFAULT_USER_MENU_ITEMS}
      defaultExpandedGroups={{ claims: true, customers: true }}
      loadSettings={getAdminUserMenu}
      saveSettings={updateAdminUserMenu}
      hasChanges={hasMenuChanges}
      moveNodeWithMeta={moveUserMenuNodeWithMeta}
      mergeIntoGroup={mergeUserMenusIntoGroup}
      dissolveGroup={dissolveUserCustomGroup}
      promoteChild={promoteChildToTop}
      isChildEligible={isChildEligibleForUser}
      isMenuEligible={isMenuEligibleForUser}
    />
  );
}
