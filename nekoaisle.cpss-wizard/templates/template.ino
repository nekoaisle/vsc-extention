/**
 * ___title___
 * 
 * filename:  ___filename___
 * 
 * @package   
 * @version   1.0.0
 * @copyright Copyright (C) ___copyright___ CREANSMAERD CO.,LTD.  All rights reserved.
 * @date      ___date___
 * @author    ___author___
 */
#define _DEBUG_
#include <KyaApp.h>

#define KYA_TIMER_INTERVAL 100

/**
 * メインクラス定義
 */
class ___class___ : public KyaApp
{
public:
	/**
	 * ピン番号定義
	 */
	enum {
		PIN_LED_RED   = 5,		// D1
		PIN_LED_GREEN = 4,		// D2
	};

	/**
	 * 構築
	 */
	___class___( ) {
		// デフォルトインプリメンテーションの呼び出し
	}

	/**
	 * 設定
	 * 
	 * ※１度しか呼ばれないのでインラインで記述すべきです。
	 * 
	 * @access public
	 */
	virtual void onSetup( ) {
		// デフォルトインプリメンテーションの呼び出し
		KyaApp::onSetup( );

		// 独自実装
		pinMode( PIN_LED_RED  , OUTPUT );
		pinMode( PIN_LED_GREEN, OUTPUT );
	}

	/**
	 * ループ
	 * 
	 * 複雑な処理を書くならばプロトタイプ定義の外に出しましょう。
	 * 
	 * @access public
	 */
	virtual void onLoop() {
		// デフォルトインプリメンテーションの呼び出し
		KyaApp::onLoop( );

//		loopDots.pr( (ir == LOW) ? '.' : '|' );
	}

	/**
	 * タイマー割り込み
	 * 
	 * @access public
	 */
	virtual void onTimer() {
		// デフォルトインプリメンテーションの呼び出し
		KyaApp::onTimer( );
	}

} app;
