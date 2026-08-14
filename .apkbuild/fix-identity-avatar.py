from pathlib import Path
import sys

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('build-input/source')

layout = root / 'res/layout/activity_main.xml'
s = layout.read_text()
old = '''        <LinearLayout
            android:id="@+id/drawerIdentityCard"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginBottom="6dp"
            android:background="@drawable/identity_card_background"
            android:clickable="true"
            android:focusable="true"
            android:gravity="center_vertical"
            android:minHeight="@dimen/identity_card_min_height"
            android:orientation="horizontal">

            <ImageView
                android:id="@+id/drawerIdentityAvatar"
                android:layout_width="@dimen/identity_avatar_size"
                android:layout_height="@dimen/identity_avatar_size"
                android:background="@drawable/identity_avatar_background"
                android:contentDescription="Current forum identity avatar"
                android:padding="5dp"
                android:scaleType="centerInside"
                android:src="@drawable/htg_app_logo" />'''
new = '''        <LinearLayout
            android:id="@+id/drawerIdentityCard"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginBottom="6dp"
            android:background="@drawable/identity_card_background"
            android:clickable="true"
            android:focusable="true"
            android:gravity="center_vertical"
            android:minHeight="@dimen/identity_card_min_height"
            android:orientation="horizontal"
            android:paddingStart="8dp"
            android:paddingTop="8dp"
            android:paddingEnd="8dp"
            android:paddingBottom="8dp">

            <ImageView
                android:id="@+id/drawerIdentityAvatar"
                android:layout_width="@dimen/identity_avatar_size"
                android:layout_height="@dimen/identity_avatar_size"
                android:layout_gravity="center_vertical"
                android:adjustViewBounds="false"
                android:background="@drawable/identity_avatar_background"
                android:clipToOutline="true"
                android:contentDescription="Current forum identity avatar"
                android:cropToPadding="false"
                android:padding="6dp"
                android:scaleType="fitCenter"
                android:src="@drawable/htg_app_logo" />'''
if old not in s:
    raise SystemExit('identity layout target not found')
layout.write_text(s.replace(old, new, 1))

for rel, oldv, newv in [
    ('res/values/dimens.xml', '<dimen name="identity_avatar_size">88dp</dimen>', '<dimen name="identity_avatar_size">84dp</dimen>'),
    ('res/values-land/dimens.xml', '<dimen name="identity_avatar_size">72dp</dimen>', '<dimen name="identity_avatar_size">68dp</dimen>'),
]:
    p = root / rel
    t = p.read_text()
    if oldv not in t:
        raise SystemExit(f'identity avatar dimen target not found: {rel}')
    p.write_text(t.replace(oldv, newv, 1))

java = root / 'src/com/harleytg/forum/MainActivity.java'
j = java.read_text()
oldj = '''        if (drawerIdentityAvatar != null) {
            drawerIdentityAvatar.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
            drawerIdentityAvatar.setAdjustViewBounds(false);
        }'''
newj = '''        if (drawerIdentityAvatar != null) {
            // Keep the complete forum avatar visible inside the rounded identity frame.
            // FIT_CENTER preserves arbitrary square/tall/wide profile-image aspect ratios.
            drawerIdentityAvatar.setScaleType(ImageView.ScaleType.FIT_CENTER);
            drawerIdentityAvatar.setAdjustViewBounds(false);
            drawerIdentityAvatar.setCropToPadding(false);
            drawerIdentityAvatar.setClipToOutline(true);
        }'''
if oldj not in j:
    raise SystemExit('identity avatar java target not found')
java.write_text(j.replace(oldj, newj, 1))

build_info = root / 'src/com/harleytg/forum/BuildInfo.java'
b = build_info.read_text()
if 'INTERNAL_BUILD = 28' in b:
    b = b.replace('INTERNAL_BUILD = 28', 'INTERNAL_BUILD = 29', 1)
build_info.write_text(b)

print('Applied v0.3.0 identity-avatar fit hotfix')
