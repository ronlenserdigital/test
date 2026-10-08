//! Local SQLite persistence exposed to the webview through narrow commands.
//!
//! The frontend owns the schema and versioned migrations (see
//! `src/data/migrations.ts`) so the same SQL runs against the native database
//! and the browser development adapter. This module only executes parameterised
//! statements; it never logs SQL parameters because they may contain study text.

use rusqlite::types::{Value as SqlValue, ValueRef};
use rusqlite::{params_from_iter, Connection};
use serde::Deserialize;
use serde_json::{Map, Number, Value};
use std::path::Path;
use std::sync::Mutex;

pub struct DbState(pub Mutex<Connection>);

pub fn open(path: &Path) -> Result<Connection, String> {
    let conn = Connection::open(path).map_err(|e| format!("open database: {e}"))?;
    conn.execute_batch(
        "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA synchronous = NORMAL;",
    )
    .map_err(|e| format!("configure database: {e}"))?;
    Ok(conn)
}

fn to_sql(v: &Value) -> SqlValue {
    match v {
        Value::Null => SqlValue::Null,
        Value::Bool(b) => SqlValue::Integer(*b as i64),
        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                SqlValue::Integer(i)
            } else {
                SqlValue::Real(n.as_f64().unwrap_or(0.0))
            }
        }
        Value::String(s) => SqlValue::Text(s.clone()),
        // Arrays/objects are stored as JSON text.
        other => SqlValue::Text(other.to_string()),
    }
}

fn from_sql(v: ValueRef<'_>) -> Value {
    match v {
        ValueRef::Null => Value::Null,
        ValueRef::Integer(i) => Value::Number(i.into()),
        ValueRef::Real(f) => Number::from_f64(f).map(Value::Number).unwrap_or(Value::Null),
        ValueRef::Text(t) => Value::String(String::from_utf8_lossy(t).into_owned()),
        ValueRef::Blob(b) => Value::String(hex::encode(b)),
    }
}

fn run_exec(conn: &Connection, sql: &str, params: &[Value]) -> Result<usize, String> {
    let mut stmt = conn.prepare_cached(sql).map_err(|e| e.to_string())?;
    stmt.execute(params_from_iter(params.iter().map(to_sql)))
        .map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct Statement {
    sql: String,
    #[serde(default)]
    params: Vec<Value>,
}

#[tauri::command]
pub fn db_execute(
    state: tauri::State<'_, DbState>,
    sql: String,
    params: Vec<Value>,
) -> Result<usize, String> {
    let conn = state.0.lock().map_err(|_| "database lock poisoned".to_string())?;
    run_exec(&conn, &sql, &params)
}

/// Runs a multi-statement script (used for migrations) inside one transaction.
#[tauri::command]
pub fn db_exec_script(state: tauri::State<'_, DbState>, sql: String) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|_| "database lock poisoned".to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute_batch(&sql).map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn db_select(
    state: tauri::State<'_, DbState>,
    sql: String,
    params: Vec<Value>,
) -> Result<Vec<Map<String, Value>>, String> {
    let conn = state.0.lock().map_err(|_| "database lock poisoned".to_string())?;
    let mut stmt = conn.prepare_cached(&sql).map_err(|e| e.to_string())?;
    let names: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();
    let mut rows = stmt
        .query(params_from_iter(params.iter().map(to_sql)))
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let mut obj = Map::with_capacity(names.len());
        for (i, name) in names.iter().enumerate() {
            let v = row.get_ref(i).map_err(|e| e.to_string())?;
            obj.insert(name.clone(), from_sql(v));
        }
        out.push(obj);
    }
    Ok(out)
}

/// Runs all statements atomically: either every statement applies or none do.
#[tauri::command]
pub fn db_batch(
    state: tauri::State<'_, DbState>,
    statements: Vec<Statement>,
) -> Result<usize, String> {
    let mut conn = state.0.lock().map_err(|_| "database lock poisoned".to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let mut total = 0;
    for s in &statements {
        total += run_exec(&tx, &s.sql, &s.params)?;
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(total)
}
