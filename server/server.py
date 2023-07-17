import json

from bilibili_api import comment, sync, video


async def main(values):

    v = video.Video(bvid=values['BVID'])
    aid = v.get_aid()
    print(aid)

    # 存储评论
    comments = []

    # 页码
    page = 1

    # 当前已获取数量
    count = 0
    while True:
        # 获取评论
        c = await comment.get_comments(aid, comment.CommentResourceType.VIDEO, page)
        # 存储评论
        comments.extend(c['replies'])
        # 增加已获取数量
        count += c['page']['size']
        # 增加页码
        page += 1

        if count >= c['page']['count']:
            # 当前已获取数量已达到评论总数，跳出循环
            break

    # 打印评论
    for cmt in comments:
        print(f"{cmt['member']['uname']}: {cmt['content']['message']}")

    # 打印评论总数
    print(f"共有 {count} 条评论（不含子评论）")

if __name__ == '__main__':
    
    with open("config.json", "r") as f:
        values = json.load(f)

    sync(main(values))