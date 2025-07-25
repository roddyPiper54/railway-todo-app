import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { useCookies } from "react-cookie";
import axios from "axios";
import { Header } from "../components/Header";
import { url } from "../const";
import "./home.scss";

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState("todo"); // todo->未完了 done->完了
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState();
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState(false)
  const [cookies] = useCookies();
  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);

  const currentTime = new Date().toLocaleDateString('ja-JP');
  console.log(currentTime)

  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data);
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      });
  }, []);

  useEffect(() => {
    const listId = lists[0]?.id;
    if (typeof listId !== "undefined") {
      setSelectListId(listId);
      axios
        .get(`${url}/lists/${listId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks);
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        });
    }
  }, [lists]);

  const handleSelectList = (id) => {
    setSelectListId(id);
    axios
      .get(`${url}/lists/${id}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks);
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`);
      });
  };
  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p>
                <Link to="/list/new">リスト新規作成</Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`}>
                  選択中のリストを編集
                </Link>
              </p>
            </div>
          </div>
          <ul className="list-tab">
            {lists.map((list, key) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  key={key}
                  className={`list-tab-item ${isActive ? "active" : ""}`}
                  onClick={() => handleSelectList(list.id)}
                >
                  {list.title}
                </li>
              );
            })}
          </ul>
          <div className="tasks">
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <Link to="/task/new">タスク新規作成</Link>
            </div>
            <div className="display-select-wrapper">
              <select
                onChange={handleIsDoneDisplayChange}
                className="display-select"
              >
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks
              tasks={tasks}
              selectListId={selectListId}
              isDoneDisplay={isDoneDisplay}
            />
          </div>
        </div>

        <div className="modalWrapper is-closed">
          <div className="modal">
            modal中身
          </div>
        </div>
      </main>
    </div>
  );
};

// 表示するタスク
const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay } = props;

  //現在時刻と期限の差分を計算
  const getRemainingTime = (limitString)=>{
    //limitString→例："2025-05-23T04:01:00.000Z" UCT
    const now = new Date();
    const limit = new Date(limitString); // Z付きのUTC → newDate()でJST補正/2025-05-23 13:01:00 (JST)
    const diffMs = limit - now;

    if(diffMs <= 0){
      return "期限切れ"
    }

    const diffMinutes = Math.floor(diffMs/1000/60); //切捨て
    const days= Math.floor(diffMinutes/(60*24));
    const hours = Math.floor(diffMinutes % (60*24)/60);
    const minutes=diffMinutes%60;

    return `残り時間：${days}日 ${hours}時間 ${minutes}分`
  }

  //期日をJSTの文字列に変換
  const formatJST = (lim)=> {
    const tmpLim = new Date(lim);

    return tmpLim.toLocaleString(); //表示形式 2025/6/17 12:28:00
  }

  //Modal開閉
  const openEditTaskModal = (e) => {
    //クリックしたliを指定
    //モーダル表示クラスを付与
    document.getElementsByClassName("modalWrapper")[0].classList.toggle("is-closed");
    //指定のタスク編集モーダル表示
  }


  if (tasks === null) return <></>;

  if (isDoneDisplay == "done") {
    return (
      <ul>
        {tasks
          .filter((task) => {
            return task.done === true;
          })
          .map((task, key) => (
            <li key={key} className="task-item">
              <Link
                to={`/lists/${selectListId}/tasks/${task.id}`}
                className="task-item-link"
              >
                {task.title}
                <br />
                期限：{formatJST(task.limit)}
                <br />
                残り時間：{getRemainingTime(task.limit)}
                <br />
                {task.done ? "完了" : "未完了"}
              </Link>
            </li>
          ))}
      </ul>
    );
  }

  return (
    <ul>
      {tasks
        .filter((task) => {
          return task.done === false;
        })
        .map((task, key) => (
          // <li key={key} className="task-item"
          //   onClick={openEditTaskModal}
          // >
          // <li className="task-item">
          //   <Link
          //     to={`/lists/${selectListId}/tasks/${task.id}`}
          //     className="task-item-link"
          //   >
          //     {task.title}
          //     <br />
          //     期限：{formatJST(task.limit)}
          //     <br />
          //     {/* 残り時間 */}
          //     {getRemainingTime(task.limit)}
          //     <br />
          //     {task.done ? "完了" : "未完了"}
          //   </Link>
          // </li>


          <li key={key} className="task-item"
            onClick={openEditTaskModal}
          >
          {/* <li className="task-item"> */}
            {/* <Link
              to={`/lists/${selectListId}/tasks/${task.id}`}
              className="task-item-link"
            > */}
              {task.title}
              <br />
              期限：{formatJST(task.limit)}
              <br />
              {/* 残り時間 */}
              {getRemainingTime(task.limit)}
              <br />
              {task.done ? "完了" : "未完了"}
            {/* </Link> */}
          </li>

        ))}
    </ul>
  );
};
