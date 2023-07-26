import os
import json
import time
import requests

from bilibili_api import comment, sync, video, Credential


# Server Configuration
HOST = '127.0.0.1:5000' # The port is shown on the terminal when you run the server
# localhost might cause problem
URI = f'http://{HOST}/api/v1/chat' # For local streaming, the websockets are hosted without ssl - http://

# Language Model Configuration
NAME = "B站网友"
DEBUG = True

def run(user_input, history):
    request = {
        'user_input': user_input,
        'max_new_tokens': 2048, #250
        'history': history,
        'mode': 'chat',  # Valid options: 'chat', 'chat-instruct', 'instruct'
        'character': 'ReplyAI',
        'instruction_template': 'Alpaca',
        'your_name': NAME,

        'regenerate': False,
        '_continue': False,
        'stop_at_newline': True,
        'chat_generation_attempts': 1,
        'chat-instruct_command': 'Continue the chat dialogue below. Write a single reply for the character "<|character|>".\n\n<|prompt|>',

        # Generation params. If 'preset' is set to different than 'None', the values
        # in presets/preset-name.yaml are used instead of the individual numbers.
        'preset': 'None',
        'do_sample': True,
        'temperature': 0.7,
        'top_p': 0.1,
        'typical_p': 1,
        'epsilon_cutoff': 0,  # In units of 1e-4
        'eta_cutoff': 0,  # In units of 1e-4
        'tfs': 1,
        'top_a': 0,
        'repetition_penalty': 1.18,
        'repetition_penalty_range': 0,
        'top_k': 40,
        'min_length': 0,
        'no_repeat_ngram_size': 0,
        'num_beams': 1,
        'penalty_alpha': 0,
        'length_penalty': 1,
        'early_stopping': False,
        'mirostat_mode': 0,
        'mirostat_tau': 5,
        'mirostat_eta': 0.1,

        'seed': 0,
        'add_bos_token': True,
        'truncation_length': 8192, #2048
        'ban_eos_token': False,
        'skip_special_tokens': True,
        'stopping_strings': []
    }

    response = requests.post(URI, json=request)

    if DEBUG:
        print(response)

    if response.status_code == 200:
        if DEBUG:
            print(json.dumps(response.json(), indent=4, ensure_ascii=False).encode('utf8').decode())
        return response.json()['results'][0]["history"]['visible'][-1][1]
    else:
        return None
    

async def main(aid, credential, stored_rpid_set, values):

    comments = []
    page = 1
    num_comment = 0
    num_comment_unreplied = 0

    # comment_page = await comment.get_comments(
    #     aid, 
    #     comment.CommentResourceType.VIDEO,
    #     page,
    #     credential=credential
    # ) # Ranked by TIME (newest to oldest).
    
    # print(comment_page)
    # comment_unreplied = [c for c in comment_page['replies'] if not c["up_action"]["reply"]]
    # comments.extend(comment_unreplied)

    # num_comment_unreplied += len(comment_unreplied)
    # num_comment += comment_page['page']['size']

    # while True:
    for i in range(1): # Test for 1 page.
        comment_page = await comment.get_comments(
            aid, 
            comment.CommentResourceType.VIDEO,
            page,
            credential=credential
        ) # Ranked by TIME (newest to oldest).

        if comment_page["replies"] is None:
            # TODO: Maintain a list (set) of unreplied comments. 
            # If any comment in current page is in the list (set), break the loop and stop requesting new pages.
            print("All comments processed!")
            # time.sleep(600) # Wait for 10 minutes.
            break

        comment_unreplied = [c for c in comment_page['replies'] if not c["up_action"]["reply"] and c['rpid'] not in stored_rpid_set]

        comments.extend(comment_unreplied)

        num_comment_unreplied += len(comment_unreplied)
        num_comment += comment_page['page']['size']

        page += 1

        if num_comment >= comment_page['page']['count']: # If the number of fetched comments reaches the total number of comments, break the loop.
            break

        # for cmt in comment_unreplied:
        #     print(f"{cmt['member']['uname']}: {cmt['content']['message']}")

        time.sleep(3) # Avoid being banned by bilibili.

    # for cmt in comments:
    #     print(f"{cmt['member']['uname']}: {cmt['content']['message']}")

    # 打印评论总数
    print(f"共有 {num_comment} 条评论（不含子评论），其中 {num_comment_unreplied} 条未回复。")

    return comments

async def send_reply(reply, aid, cmt, credential):
    result = await comment.send_comment(
        reply, 
        aid, 
        comment.CommentResourceType.VIDEO, 
        root=cmt['rpid'],
        credential=credential
    )
        

if __name__ == '__main__':
    
    with open("config.json", "r") as f:
        values = json.load(f)
    
    if os.path.exists('comments.json'):
        with open('comments.json', 'r') as f:
            stored_comments = json.load(f)
    else:
        stored_comments = []

    stored_rpid_set = {cmt['rpid'] for cmt in stored_comments}

    if DEBUG:
        print(stored_rpid_set)
    
    credential = Credential(
        sessdata=values["SESSDATA"], 
        bili_jct=values["bili_jct"], 
        buvid3=values["buvid3"], 
        dedeuserid=values["dedeuserid"]
    )

    v = video.Video(bvid=values['BVID'])
    aid = v.get_aid()

    comments = sync(main(aid, credential, stored_rpid_set, values))

    history = {'internal': [], 'visible': []}
    
    for cmt in comments: # Test for 10 comment.
        print(f"{cmt['member']['uname']}: {cmt['content']['message']}")

        time_ckpt = time.time()
        
        # send comment to text-generation-webui
        user_input = cmt['content']['message']
        reply = run(user_input, history)

        # reply += "\n--来自云若，林亦的AI助理，经林亦确认后发出。"

        if reply is not None:
            print("%s: %s (Time %d ms)" % ("云若", reply, (time.time() - time_ckpt) * 1000))
            cmt["reply"] = reply
            stored_comments.append(cmt)

        # Send reply to bilibili
        # result = sync(send_reply(reply, aid, cmt, credential))
        # print(result)
        # time.sleep(3) # Don't need to set waiting time. The time of comment generation is enough.

    with open("comments.json", "w") as f:
        json.dump(stored_comments, f, indent=4, ensure_ascii=False)