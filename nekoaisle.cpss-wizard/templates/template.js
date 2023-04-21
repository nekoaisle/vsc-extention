/**
 * ___title___
 *
 * filename:  ___filename___
 * 
 * @version   0.1.1
 * @copyright Copyright (C) ___copyright___ ___author___ All rights reserved.
 * @date	  ___date___
 * @author	___author___
 */
(function($) {
	//プラグイン定義
	$.fn.___class___ = function(options){
		 
		//引数を設定する
		var defaults = {
			text: ''
		};
		var options = $.extend( defaults, options );
		 
		//アラートを表示
		alert(setting.text);
 
		//メソッドチェーン対応(thisを返す)
		return(this);
	};
})(jQuery);
