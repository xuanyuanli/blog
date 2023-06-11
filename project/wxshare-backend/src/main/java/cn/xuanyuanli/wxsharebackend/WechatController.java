package cn.xuanyuanli.wxsharebackend;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import me.chanjar.weixin.common.bean.WxJsapiSignature;
import me.chanjar.weixin.common.error.WxErrorException;
import me.chanjar.weixin.mp.api.WxMpService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author xuanyuanli
 * @date 2023/6/7
 */
@SuppressWarnings("MissingJavadoc")
@Slf4j
@RestController
@Tag(name = "微信相关")
public class WechatController {

    @Resource
    private WxMpService wxMpService;

    @Operation(summary = "获得JSSDK信息", description = "微信官方文档：https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html")
    @GetMapping("/wechat/jsSdkConfig")
    public WechatJsSdkDTO jsSdkConfig(String url) throws WxErrorException {
        url = url.split("#")[0];
        url = decodeURIComponent(url);
        WxJsapiSignature jsapiSignature = wxMpService.createJsapiSignature(url);
        WechatJsSdkDTO dto = new WechatJsSdkDTO();
        dto.setNonceStr(jsapiSignature.getNonceStr());
        dto.setSignature(jsapiSignature.getSignature());
        dto.setTimestamp(jsapiSignature.getTimestamp());
        dto.setAppId(jsapiSignature.getAppId());
        return dto;
    }

    /**
     * java版的decodeURIComponent
     *
     * @param url url
     * @return {@link String}
     */
    @SuppressWarnings("AlibabaLowerCamelCaseVariableNaming")
    public static String decodeURIComponent(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }
        // 对于URLDecoder.decode中+表空格的问题进行处理
        url = url.replace("+", "%2B");
        return URLDecoder.decode(url, StandardCharsets.UTF_8);
    }

    @Data
    @Schema(name = "wechat-获取JS-SDK信息")
    public static class WechatJsSdkDTO {

        @Schema(name = "nonceStr")
        private String nonceStr;
        @Schema(name = "signature")
        private String signature;
        @Schema(name = "timestamp")
        private Long timestamp;
        @Schema(name = "appId")
        private String appId;
    }
}
