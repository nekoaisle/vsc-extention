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
 * ���C���N���X��`
 */
class ___class___ : public KyaApp
{
public:
	/**
	 * �s���ԍ���`
	 */
	enum {
		PIN_LED_RED   = 5,		// D1
		PIN_LED_GREEN = 4,		// D2
	};

	/**
	 * �\�z
	 */
	___class___( ) {
		// �f�t�H���g�C���v�������e�[�V�����̌Ăяo��
	}

	/**
	 * �ݒ�
	 * 
	 * ���P�x�����Ă΂�Ȃ��̂ŃC�����C���ŋL�q���ׂ��ł��B
	 * 
	 * @access public
	 */
	virtual void onSetup( ) {
		// �f�t�H���g�C���v�������e�[�V�����̌Ăяo��
		KyaApp::onSetup( );

		// �Ǝ�����
		pinMode( PIN_LED_RED  , OUTPUT );
		pinMode( PIN_LED_GREEN, OUTPUT );
	}

	/**
	 * ���[�v
	 * 
	 * ���G�ȏ����������Ȃ�΃v���g�^�C�v��`�̊O�ɏo���܂��傤�B
	 * 
	 * @access public
	 */
	virtual void onLoop() {
		// �f�t�H���g�C���v�������e�[�V�����̌Ăяo��
		KyaApp::onLoop( );

//		loopDots.pr( (ir == LOW) ? '.' : '|' );
	}

	/**
	 * �^�C�}�[���荞��
	 * 
	 * @access public
	 */
	virtual void onTimer() {
		// �f�t�H���g�C���v�������e�[�V�����̌Ăяo��
		KyaApp::onTimer( );
	}

} app;
