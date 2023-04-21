/**
 * ___title___
 * 
 * filename: ___filename___
 * 
 * @copyright Copyright (C) ___copyright___ CREANSMAERD CO.,LTD.  All rights reserved.
 * @date    ___date___
 * @author  ___author___
*/
set autocommit=0;
start transaction;

/**
 * 構築
 */
drop table if exists ___class___;
create table ___class___ (
  -- 全テーブル共通情報
  V_ID              varchar(  64) primary key        , -- ID
  D_REGIST_DT       char   (  14) not null default '', -- 登録日
  D_UPDATE_DT       char   (  14) not null default '', -- 更新日
  V_NOTE            varchar( 255) not null default '', -- 備考
  --
  -- インデックス
  index IDX_()
)
ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

/**
 * 初期設定
 */
delete from SEQUENCE where V_NAME = '___class____V_ID';
insert into SEQUENCE (
  V_NAME,
  N_NUMBER,
  N_PRECISION,
  N_INITIAL,
  N_LOOP
) values (
  '___class____V_ID',  -- 名前
  1000000,           -- 値 (1 ～ 999999 はシステム予約)
  16,                -- 桁数
  1000000,           -- 初期値
  0                  -- ループしない
);

/**
 * コミット
 */
commit;
set autocommit=1;
