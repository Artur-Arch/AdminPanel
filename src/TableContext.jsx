import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const TableContext = createContext();

export const TableProvider = ({ children }) => {
  const [tables, setTables] = useState([]);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await axios.get("https://suddocs.uz/tables");
        setTables(response.data.data);
        console.log("Контекст: загруженные столы:", response.data.data);
      } catch (err) {
        console.error("Ошибка загрузки столов в контексте:", err);
      }
    };
    fetchTables();
  }, []);

  return (
    <TableContext.Provider value={{ tables, setTables }}>
      {console.log("TableContext value:", { tables, setTables })}
      {children}
    </TableContext.Provider>
  );
};
