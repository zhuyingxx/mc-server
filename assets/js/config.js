/* ===================================================================
   只改这一个文件，全站信息自动更新
   -------------------------------------------------------------------
   1. serverIp      服务器地址（游戏里填的那个；不公开就留空，页面显示"进群获取"）
   2. qq1 / qq2     1 群、2 群的群号
   3. qqJoin        点"一键加群"跳转的链接（QQ 群分享链接；没有就留空）
   4. kuaishou      快手主页链接（现在填的是"竹影c"的搜索页，换成你自己的主页最好）
   5. kuaishouId    快手号（页面上显示，方便粉丝直接搜）
   6. packDownload  整合包下载链接（本地预览用相对路径，线上用 GitHub 发布附件地址）
   =================================================================== */

window.SITE = {
  serverIp:     "",
  qq1:          "973042992",
  qq2:          "680984791",
  qqJoin:       "",
  kuaishou:     "https://www.kuaishou.com/search/video?searchKey=%E7%AB%B9%E5%BD%B1c",
  kuaishouId:   "zhuyingc1314",
  packDownload: (location.hostname === "zhuyingxx.github.io"
    ? "https://github.com/zhuyingxx/mc-server/releases/download/v1.0.0/AC26.3-client.zip"
    : "assets/download/AC26.3-client.zip")
};